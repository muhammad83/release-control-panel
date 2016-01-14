var gulp = require("gulp");

gulp.task("watch", function ()
{
    return gulp.watch("./public/src/**/*", ["webpack"]);
});