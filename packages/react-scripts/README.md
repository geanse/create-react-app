# react-scripts

---

This fork includes the following changes:

1. **New Webpack Configuration:**

   - Introduces a new webpack configuration with a different entry point: `src/widget.js`.
   - Aims to output a single JavaScript file.
   - Outputs everything to `/widget` by default.
   - The new webpack configuration accepts the following environment variables:
     - `WIDGET_PUBLIC_URL` (similar to `PUBLIC_URL`): Defaults to `"/widget/"`.
     - `WIDGET_BUILD_PATH` (similar to `BUILD_PATH`): Defaults to `"build/widget"`.

2. **Development Mode Enhancements:**

   - You can pass a new argument `--widget` to the `start` script in development mode.
   - When the `--widget` argument is passed, `webpack-dev-server` uses the new webpack configuration.
   - `webpack-dev-server` accepts the following environment variable:
     - `WIDGET_PORT` (similar to `PORT`): Defaults to `3210`.

3. **Proxying Requests in Development Mode:**
   - In development mode, all requests to `/widget/**/*` are proxied to the `/widget/**/*` path of the `webpack-dev-server` instance running with the `--widget` argument.

Steps to publish to npm

1. Update package.json version
1. Run:

   ```
   $ npm login
   $ npm publish
   ```

---

This package includes scripts and configuration used by [Create React App](https://github.com/facebook/create-react-app).<br>
Please refer to its documentation:

- [Getting Started](https://facebook.github.io/create-react-app/docs/getting-started) – How to create a new app.
- [User Guide](https://facebook.github.io/create-react-app/) – How to develop apps bootstrapped with Create React App.
