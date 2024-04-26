// This file was auto-generated by action-io-generator. Do not edit by hand!
export enum Inputs {
    /**
     * Label the image with this ARCH, instead of defaulting to the host architecture
     * Required: false
     * Default: None.
     */
    ARCH = "arch",
    /**
     * 'Same as input 'arch', use this for multiple architectures.
     * Seperate them by a comma'
     * Required: false
     * Default: None.
     */
    ARCHS = "archs",
    /**
     * The base image to use to create a new container image
     * Required: false
     * Default: None.
     */
    BASE_IMAGE = "base-image",
    /**
     * List of --build-args to pass to buildah
     * Required: false
     * Default: None.
     */
    BUILD_ARGS = "build-args",
    /**
     * List of Containerfile paths (eg: ./Containerfile)
     * Required: false
     * Default: None.
     */
    CONTAINERFILES = "containerfiles",
    /**
     * List of files/directories to copy inside the base image
     * Required: false
     * Default: None.
     */
    CONTENT = "content",
    /**
     * Path of the directory to use as context (default: .)
     * Required: false
     * Default: "."
     */
    CONTEXT = "context",
    /**
     * Alias for "containerfiles". "containerfiles" takes precedence if both are set.
     * Required: false
     * Default: None.
     */
    DOCKERFILES = "dockerfiles",
    /**
     * The entry point to set for containers based on image
     * Required: false
     * Default: None.
     */
    ENTRYPOINT = "entrypoint",
    /**
     * List of environment variables to be set when running containers based on image
     * Required: false
     * Default: None.
     */
    ENVS = "envs",
    /**
     * Extra args to be passed to buildah bud and buildah from.
     * Separate arguments by newline. Do not use quotes - @actions/exec will do the quoting for you.
     * Required: false
     * Default: None.
     */
    EXTRA_ARGS = "extra-args",
    /**
     * The name (reference) of the image to build
     * Required: false
     * Default: None.
     */
    IMAGE = "image",
    /**
     * The labels of the image to build. Seperate by newline. For example, "io.containers.capabilities=sys_admin,mknod".
     * Required: false
     * Default: None.
     */
    LABELS = "labels",
    /**
     * Set to true to cache intermediate layers during build process
     * Required: false
     * Default: None.
     */
    LAYERS = "layers",
    /**
     * Set to true to build using the OCI image format instead of the Docker image format
     * Required: false
     * Default: "false"
     */
    OCI = "oci",
    /**
     * Label the image with this PLATFORM, instead of defaulting to the host platform.
     * Only supported for containerfile builds.
     * Required: false
     * Default: None.
     */
    PLATFORM = "platform",
    /**
     * 'Same as input 'platform', use this for multiple platforms.
     * Seperate them by a comma'
     * Required: false
     * Default: None.
     */
    PLATFORMS = "platforms",
    /**
     * The port to expose when running containers based on image
     * Required: false
     * Default: None.
     */
    PORT = "port",
    /**
     * Set to true to squash the image layers.
     * Required: false
     * Default: "true"
     */
    SQUASH = "squash",
    /**
     * The tags of the image to build. For multiple tags, seperate by whitespace. For example, "latest v1".
     * Required: false
     * Default: "latest"
     */
    TAGS = "tags",
    /**
     * Require HTTPS and verify certificates when accessing the registry. Defaults to true.
     * Required: false
     * Default: "true"
     */
    TLS_VERIFY = "tls-verify",
    /**
     * The working directory to use within the container
     * Required: false
     * Default: None.
     */
    WORKDIR = "workdir",
}

export enum Outputs {
    /**
     * Name of the image built
     * Required: false
     * Default: None.
     */
    IMAGE = "image",
    /**
     * Name of the image tagged with the first tag present
     * Required: false
     * Default: None.
     */
    IMAGE_WITH_TAG = "image-with-tag",
    /**
     * List of the tags that were created, separated by spaces
     * Required: false
     * Default: None.
     */
    TAGS = "tags",
}
