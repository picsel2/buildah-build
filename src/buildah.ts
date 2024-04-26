/***************************************************************************************************
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 **************************************************************************************************/

import * as core from "@actions/core";
import * as exec from "@actions/exec";
import * as path from "path";
import CommandResult from "./types";
import { isStorageDriverOverlay, findFuseOverlayfsPath, getFullImageName } from "./utils";

export interface BuildahConfigSettings {
    entrypoint?: string[];
    envs?: string[];
    port?: string;
    workingdir?: string;
    arch?: string;
    labels?: string[];
}

interface Buildah {
    buildUsingDocker(
        image: string, context: string, containerFiles: string[], buildArgs: string[],
        useOCI: boolean, labels: string[], layers: string,
        extraArgs: string[], tlsVerify: boolean, arch?: string, platform?: string,
    ): Promise<CommandResult>;
    from(baseImage: string, tlsVerify: boolean, extraArgs: string[]): Promise<CommandResult>;
    config(container: string, setting: BuildahConfigSettings): Promise<CommandResult>;
    copy(container: string, contentToCopy: string[]): Promise<CommandResult | undefined>;
    commit(container: string, newImageName: string, useOCI: boolean): Promise<CommandResult>;
    manifestCreate(manifest: string): Promise<void>;
    manifestAdd(manifest: string, imageName: string, tags: string[]): Promise<void>;
}

export class BuildahCli implements Buildah {
    private readonly executable: string;

    public storageOptsEnv = "";

    constructor(executable: string) {
        this.executable = executable;
    }

    // Checks for storage driver if found "overlay",
    // then checks if "fuse-overlayfs" is installed.
    // If yes, add mount program to use "fuse-overlayfs"
    async setStorageOptsEnv(): Promise<void> {
        if (await isStorageDriverOverlay()) {
            const fuseOverlayfsPath = await findFuseOverlayfsPath();
            if (fuseOverlayfsPath) {
                core.info(`Overriding storage mount_program with "fuse-overlayfs" in environment`);
                this.storageOptsEnv = `overlay.mount_program=${fuseOverlayfsPath}`;
            }
            else {
                core.warning(`"fuse-overlayfs" is not found. Install it before running this action. `
                + `For more detail see https://github.com/redhat-actions/buildah-build/issues/45`);
            }
        }
        else {
            core.info("Storage driver is not 'overlay', so not overriding storage configuration");
        }
    }

    private static getImageFormatOption(useOCI: boolean): string[] {
        return [ "--format", useOCI ? "oci" : "docker" ];
    }

    async buildUsingDocker(
        image: string,
        context: string,
        containerFiles: string[],
        buildArgs: string[],
        useOCI: boolean,
        labels: string[],
        layers: string,
        extraArgs: string[],
        tlsVerify: boolean,
        arch?: string,
        platform?: string
    ): Promise<CommandResult> {
        const args: string[] = [ "bud" ];
        if (arch) {
            args.push("--arch");
            args.push(arch);
        }
        if (platform) {
            args.push("--platform");
            args.push(platform);
        }
        containerFiles.forEach((file) => {
            args.push("-f");
            args.push(file);
        });
        labels.forEach((label) => {
            args.push("--label");
            args.push(label);
        });
        buildArgs.forEach((buildArg) => {
            args.push("--build-arg");
            args.push(buildArg);
        });
        args.push(...BuildahCli.getImageFormatOption(useOCI));
        args.push(`--tls-verify=${tlsVerify}`);
        if (layers) {
            args.push(`--layers=${layers}`);
        }
        if (extraArgs.length > 0) {
            args.push(...extraArgs);
        }
        args.push("-t");
        args.push(image);
        args.push(context);
        return this.execute(args);
    }

    async from(baseImage: string, tlsVerify: boolean, extraArgs: string[]): Promise<CommandResult> {
        const args: string[] = [ "from" ];
        args.push(`--tls-verify=${tlsVerify}`);
        if (extraArgs.length > 0) {
            args.push(...extraArgs);
        }
        args.push(baseImage);
        return this.execute(args);
    }

    async copy(container: string, contentToCopy: string[], contentPath?: string): Promise<CommandResult | undefined> {
        if (contentToCopy.length === 0) {
            return undefined;
        }

        core.debug("copy");
        core.debug(container);
        core.debug("content: " + contentToCopy.join(" "));
        if (contentToCopy.length > 0) {
            const args: string[] = [ "copy", container ].concat(contentToCopy);
            if (contentPath) {
                args.push(contentPath);
            }
            return this.execute(args);
        }

        return undefined;
    }

    async config(container: string, settings: BuildahConfigSettings): Promise<CommandResult> {
        core.debug("config");
        core.debug(container);
        const args: string[] = [ "config" ];
        if (settings.entrypoint && settings.entrypoint.length > 0) {
            args.push("--entrypoint");
            args.push(BuildahCli.convertArrayToStringArg(settings.entrypoint));
        }
        if (settings.port) {
            args.push("--port");
            args.push(settings.port);
        }
        if (settings.envs) {
            settings.envs.forEach((env) => {
                args.push("--env");
                args.push(env);
            });
        }
        if (settings.arch) {
            args.push("--arch");
            args.push(settings.arch);
        }
        if (settings.workingdir) {
            args.push("--workingdir");
            args.push(settings.workingdir);
        }
        if (settings.labels) {
            settings.labels.forEach((label) => {
                args.push("--label");
                args.push(label);
            });
        }
        args.push(container);
        return this.execute(args);
    }

    async commit(container: string, newImageName: string, useOCI: boolean): Promise<CommandResult> {
        core.debug("commit");
        core.debug(container);
        core.debug(newImageName);
        const args: string[] = [
            "commit", ...BuildahCli.getImageFormatOption(useOCI),
            "--squash", container, newImageName,
        ];
        return this.execute(args);
    }

    async tag(imageName: string, tags: string[]): Promise<void> {
        const args: string[] = [ "tag" ];
        const builtImage = [];
        for (const tag of tags) {
            args.push(getFullImageName(imageName, tag));
            builtImage.push(getFullImageName(imageName, tag));
        }
        core.info(`Tagging the built image with tags ${tags.toString()}`);
        await this.execute(args);
        core.info(`✅ Successfully built image${builtImage.length !== 1 ? "s" : ""} "${builtImage.join(", ")}"`);
    }

    // Unfortunately buildah doesn't support the exists command yet
    // https://github.com/containers/buildah/issues/4217

    // async manifestExists(manifest: string): Promise<boolean> {
    //     const args: string[] = [ "manifest", "exists" ];
    //     args.push(manifest);
    //     const execOptions: exec.ExecOptions = {ignoreReturnCode: true};
    //     core.info(`Checking if manifest ${manifest} exists`);
    //     const {exitCode} = await this.execute(args, execOptions);
    //     return exitCode ? false : true;
    // }

    async manifestRm(manifest: string): Promise<void> {
        const execOptions: exec.ExecOptions = { ignoreReturnCode: true };
        const args: string[] = [ "manifest", "rm" ];
        args.push(manifest);
        core.info(`Removing existing manifest ${manifest}`);
        await this.execute(args, execOptions);
    }

    async manifestCreate(manifest: string): Promise<void> {
        const args: string[] = [ "manifest", "create" ];
        args.push(manifest);
        core.info(`Creating manifest ${manifest}`);
        await this.execute(args);
    }

    async manifestAdd(manifest: string, image: string): Promise<void> {
        const args: string[] = [ "manifest", "add" ];
        args.push(manifest);
        args.push(image);
        core.info(`Adding image "${image}" to the manifest.`);
        await this.execute(args);
    }

    private static convertArrayToStringArg(args: string[]): string {
        let arrayAsString = "[";
        args.forEach((arg) => {
            arrayAsString += `"${arg}",`;
        });
        return `${arrayAsString.slice(0, -1)}]`;
    }

    async execute(
        args: string[],
        execOptions: exec.ExecOptions & { group?: boolean } = {},
    ): Promise<CommandResult> {
        // ghCore.info(`${EXECUTABLE} ${args.join(" ")}`)

        let stdout = "";
        let stderr = "";

        const finalExecOptions = { ...execOptions };
        finalExecOptions.ignoreReturnCode = true;     // the return code is processed below

        finalExecOptions.listeners = {
            stdline: (line): void => {
                stdout += line + "\n";
            },
            errline: (line):void => {
                stderr += line + "\n";
            },
        };

        if (execOptions.group) {
            const groupName = [ this.executable, ...args ].join(" ");
            core.startGroup(groupName);
        }

        // To solve https://github.com/redhat-actions/buildah-build/issues/45
        const execEnv: { [key: string] : string } = {};
        Object.entries(process.env).forEach(([ key, value ]) => {
            if (value != null) {
                execEnv[key] = value;
            }
        });

        if (this.storageOptsEnv) {
            execEnv.STORAGE_OPTS = this.storageOptsEnv;
        }

        finalExecOptions.env = execEnv;

        try {
            const exitCode = await exec.exec(this.executable, args, finalExecOptions);

            if (execOptions.ignoreReturnCode !== true && exitCode !== 0) {
                // Throwing the stderr as part of the Error makes the stderr
                // show up in the action outline, which saves some clicking when debugging.
                let error = `${path.basename(this.executable)} exited with code ${exitCode}`;
                if (stderr) {
                    error += `\n${stderr}`;
                }
                throw new Error(error);
            }

            return {
                exitCode, output: stdout, error: stderr,
            };
        }

        finally {
            if (execOptions.group) {
                core.endGroup();
            }
        }
    }
}
