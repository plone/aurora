1.  Install or update the supported LTS versions of Node.js, then activate the version supported in Plone Aurora.

    ```shell
    nvm install --lts
    nvm use --lts
    ```

2.  Verify that the supported version of Node.js is activated.

    ```shell
    node -v
    ```

3.  Install and enable the latest {term}`corepack` so that it uses the package manager version pinned by Plone Aurora.

    ```shell
    npm install --global corepack@latest
    corepack enable
    ```
