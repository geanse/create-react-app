// @remove-on-eject-begin
/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
// @remove-on-eject-end
'use strict';

// Do this as the first thing so that any code reading it knows the right env.
process.env.BABEL_ENV = 'development';
process.env.NODE_ENV = 'development';

// Makes the script crash on unhandled rejections instead of silently
// ignoring them. In the future, promise rejections that are not handled will
// terminate the Node.js process with a non-zero exit code.
process.on('unhandledRejection', err => {
  throw err;
});

// Ensure environment variables are read.
require('../config/env');
// @remove-on-eject-begin
// Do the preflight check (only happens before eject).
const verifyPackageTree = require('./utils/verifyPackageTree');
if (process.env.SKIP_PREFLIGHT_CHECK !== 'true') {
  verifyPackageTree();
}
const verifyTypeScriptSetup = require('./utils/verifyTypeScriptSetup');
verifyTypeScriptSetup();
// @remove-on-eject-end

const fs = require('fs');
const chalk = require('react-dev-utils/chalk');
const webpack = require('webpack');
const WebpackDevServer = require('webpack-dev-server');
const clearConsole = require('react-dev-utils/clearConsole');
const checkRequiredFiles = require('react-dev-utils/checkRequiredFiles');
const {
  choosePort,
  createCompiler,
  prepareProxy,
  prepareUrls,
} = require('react-dev-utils/WebpackDevServerUtils');
const openBrowser = require('react-dev-utils/openBrowser');
const semver = require('semver');
const paths = require('../config/paths');
const configFactory = require('../config/webpack.config');
const createDevServerConfig = require('../config/webpackDevServer.config');
const getClientEnvironment = require('../config/env');
const react = require(require.resolve('react', { paths: [paths.appPath] }));

const env = getClientEnvironment(paths.publicUrlOrPath.slice(0, -1));
const useYarn = fs.existsSync(paths.yarnLockFile);
const isInteractive = process.stdout.isTTY;

// Warn and crash if required files are missing
if (!checkRequiredFiles([paths.appHtml, paths.appIndexJs])) {
  process.exit(1);
}

const argv = process.argv.slice(2);
const startWidgetWebpackDevServer = argv.indexOf('--widget') !== -1;

// Tools like Cloud9 rely on this.
const DEFAULT_PORT = parseInt(process.env.PORT, 10) || 3000;
const WIDGET_DEFAULT_PORT = parseInt(process.env.WIDGET_PORT, 10) || 3210;
const HOST = process.env.HOST || '0.0.0.0';

if (process.env.HOST) {
  console.log(
    chalk.cyan(
      `Attempting to bind to HOST environment variable: ${chalk.yellow(
        chalk.bold(process.env.HOST)
      )}`
    )
  );
  console.log(
    `If this was unintentional, check that you haven't mistakenly set it in your shell.`
  );
  console.log(
    `Learn more here: ${chalk.yellow('https://cra.link/advanced-config')}`
  );
  console.log();
}

// We require that you explicitly set browsers and do not fall back to
// browserslist defaults.
const { checkBrowsers } = require('react-dev-utils/browsersHelper');
checkBrowsers(paths.appPath, isInteractive)
  .then(() => {
    // We attempt to use the default port but if it is busy, we offer the user to
    // run on a different port. `choosePort()` Promise resolves to the next free port.
    return Promise.all([WIDGET_DEFAULT_PORT, DEFAULT_PORT]);
  })
  .then(([widgetPort, port]) => {
    if (widgetPort == null || port == null) {
      // We have not found a port.
      return;
    }

    const configs = configFactory('development');
    const protocol = process.env.HTTPS === 'true' ? 'https' : 'http';
    const appName = require(paths.appPackageJson).name;

    const useTypeScript = fs.existsSync(paths.appTsConfig);
    const tscCompileOnError = process.env.TSC_COMPILE_ON_ERROR === 'true';
    const urls = prepareUrls(
      protocol,
      HOST,
      port,
      paths.publicUrlOrPath.slice(0, -1)
    );
    const widgetUrls = prepareUrls(
      protocol,
      HOST,
      widgetPort,
      paths.widgetPublicUrlOrPath.slice(0, -1)
    );
    const devSocket = {
      warnings: warnings =>
        devServer.sockWrite(devServer.sockets, 'warnings', warnings),
      errors: errors =>
        devServer.sockWrite(devServer.sockets, 'errors', errors),
    };
    // Create a webpack compiler that is configured with custom messages.
    let compiler;
    if (startWidgetWebpackDevServer) {
      compiler = createCompiler({
        appName: `widget_${appName}`,
        config: configs[0],
        devSocket,
        urls: widgetUrls,
        useYarn,
        useTypeScript,
        tscCompileOnError,
        webpack,
      });
    } else {
      compiler = createCompiler({
        appName,
        config: configs[1],
        devSocket,
        urls,
        useYarn,
        useTypeScript,
        tscCompileOnError,
        webpack,
      });
    }
    // Load proxy config
    const proxySetting = require(paths.appPackageJson).proxy;
    const proxyConfig = prepareProxy(
      proxySetting,
      paths.appPublic,
      paths.publicUrlOrPath
    );
    const widgetProxyConfig = [
      {
        context: '/widget',
        target: widgetUrls.localUrlForBrowser,
        changeOrigin: true,
        pathRewrite: { '^/widget': '/' },
      },
    ];
    // Serve webpack assets generated by the compiler over a web server.
    const serverConfig = createDevServerConfig(
      proxyConfig ? [...proxyConfig, widgetProxyConfig] : widgetProxyConfig,
      urls.lanUrlForConfig
    );
    const widgetServerConfig = createDevServerConfig(
      undefined,
      widgetUrls.lanUrlForConfig
    );

    let devServer;
    if (startWidgetWebpackDevServer) {
      // Starting both webpack dev servers creates a conflict between the two
      // that's why we start them in separate process
      devServer = new WebpackDevServer(compiler, widgetServerConfig);
    } else {
      devServer = new WebpackDevServer(compiler, serverConfig);
    }

    // Launch WebpackDevServer.
    devServer.listen(
      startWidgetWebpackDevServer ? widgetPort : port,
      HOST,
      err => {
        if (err) {
          return console.log(err);
        }
        if (isInteractive) {
          clearConsole();
        }

        if (env.raw.FAST_REFRESH && semver.lt(react.version, '16.10.0')) {
          console.log(
            chalk.yellow(
              `Fast Refresh requires React 16.10 or higher. You are using React ${react.version}.`
            )
          );
        }

        console.log(chalk.cyan('Starting the development server...\n'));
        openBrowser(
          startWidgetWebpackDevServer
            ? widgetUrls.localUrlForBrowser
            : urls.localUrlForBrowser
        );
      }
    );

    ['SIGINT', 'SIGTERM'].forEach(function (sig) {
      process.on(sig, function () {
        devServer.close();
        process.exit();
      });
    });

    if (process.env.CI !== 'true') {
      // Gracefully exit when stdin ends
      process.stdin.on('end', function () {
        devServer.close();
        process.exit();
      });
    }
  })
  .catch(err => {
    if (err && err.message) {
      console.log(err.message);
    }
    process.exit(1);
  });
