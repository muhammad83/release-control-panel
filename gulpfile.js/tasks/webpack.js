"use strict";

var gulp = require("gulp");
var gutil = require("gulp-util");
var webpack = require("webpack");

gulp.task("webpack", function (cb)
{
    webpack(
        {
            bail: false,
            entry: "./public/src/main.jsx",
            module:
            {
                loaders:
                [
                    {
                        test: /\.js$/,
                        exclude: /node_modules/,
                        loader: "babel-loader",
                        query:
                        {
                            presets: ["react", "es2015"]
                        }
                    },
                    {
                        test: /\.jsx$/,
                        exclude: /node_modules/,
                        loader: "babel-loader",
                        query:
                        {
                            presets: ["react", "es2015"]
                        }
                    }
                ]
            },
            output:
            {
                filename: "./public/js/application.js"
            }
        },
        function (err, stats)
        {
            if (err)
            {
                throw new gutil.PluginError("webpack", err);
            }

            gutil.log("[webpack]", stats.toString({
                // output options
            }));

            cb();
        });
});