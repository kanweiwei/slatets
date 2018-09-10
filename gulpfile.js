const path = require("path")
const gulp = require("gulp");
const rimraf = require("rimraf")
const ts = require('gulp-typescript');
const through2 = require('through2');
const merge2 = require('merge2');
const tsConfig = require('./getTsCommonConfig.js')();
const replaceLib = require('./replaceLib');
const babel = require('gulp-babel');
const getBabelCommonConfig = require("./getBabelCommonConfig")
const tsDefaultReporter = ts.reporter.defaultReporter();

const cwd = process.cwd();

const stripCode = require('gulp-strip-code');

const rootDir = "packages"

const entrys = [
    "slate",
    "slate-schema-violations",
    "slate-hotkeys",
    "slate-react"
]

function compileTs(stream) {
    return stream
        .pipe(ts(tsConfig)).js
        .pipe(through2.obj(function (file, encoding, next) {
            // console.log(file.path, file.base);
            file.path = file.path.replace(/\.[jt]sx$/, '.js');
            this.push(file);
            next();
        }))
}

gulp.task("clean", () => {

    rimraf.sync(path.join(cwd, "dist"))
})

gulp.task("copyOtherFiles", ["clean"], () => {
    let streams = entrys.map((entry) => {
        let source = [
            `${rootDir}/${entry}/package.json`,
            `${rootDir}/${entry}/README.md`,
            `${rootDir}/${entry}/LICENSE`
        ];
        return gulp.src(source).pipe(gulp.dest(`dist/${entry}`)).pipe(gulp.dest(`dist/${entry}`))
            .pipe(gulp.dest(`dist/${entry}`))

    })
    return merge2(streams)
})

gulp.task('tsc', ["copyOtherFiles", "clean"], () => {

    let streams = entrys.map((entry) => {
        let source = [
            `${rootDir}/${entry}/src/**/*.ts`,
            `${rootDir}/${entry}/src/**/*.tsx`,
            '!node_modules/**/*.*',
            `!${rootDir}/${entry}/node_modules/**/*.*`,
            'typings/**/*.d.ts',
        ];
        return merge2(compileTs(gulp.src(source)).pipe(gulp.dest(`dist/${entry}/dist`)));

    })
    return merge2(streams)
});

function babelify(js, modules, entry) {
    const babelConfig = getBabelCommonConfig(modules);
    delete babelConfig.cacheDirectory;
    if (modules === false) {
        babelConfig.plugins.push(replaceLib);
    } else {
        console.log(modules)
        babelConfig.plugins.push(require.resolve('babel-plugin-add-module-exports'));
    }
    let stream = js.pipe(babel(babelConfig))
    if (modules === false) {
        stream = stream.pipe(stripCode({
            start_comment: '@remove-on-es-build-begin',
            end_comment: '@remove-on-es-build-end',
        }));
    }
    return stream.pipe(gulp.dest(modules === false ? `dist/${entry}/es` : `dist/${entry}/lib`));
}

function compile(modules) {
    let error = 0;

    function check() {
        if (error && !process.argv['ignore-error']) {
            process.exit(1);
        }
    }

    let newStreams = entrys.map((entry) => {
        let source = [
            `${rootDir}/${entry}/src/**/*.ts`,
            `${rootDir}/${entry}/src/**/*.tsx`,
            '!node_modules/**/*.*',
            `!${rootDir}/${entry}/node_modules/**/*.*`,
            'typings/**/*.d.ts',
        ]
        const tsResult = gulp.src(source).pipe(ts(tsConfig, {
            error(e) {
                tsDefaultReporter.error(e);
                error = 1;
            },
            finish: tsDefaultReporter.finish,
        }));

        tsResult.on('finish', check);
        tsResult.on('end', check);
        return merge2([babelify(tsResult.js, modules, entry), tsResult.dts.pipe(gulp.dest(modules === false ? `dist/${entry}/es` : `dist/${entry}/lib`))]);
    })

    return merge2(newStreams)
}

gulp.task('compile', ['compile-with-es'], () => {
    return compile();
});

gulp.task('compile-with-es', ["tsc"], () => {
    compile(false);
});