# grunt-igdeploy

A grunt task to handle deployment to the FTI static content server.

## Basic usage

    npm install -D git+https://github.com/callumlocke/grunt-igdeploy.git

```js
grunt.loadNpmTasks('grunt-igdeploy');

grunt.initConfig({
  igdeploy: {
    options: {
      src: 'dist',
      server: 'example.com',
      targets: {
        staging: '/web/staging',
        production: '/web/prod'
      }
    }
  }
})
```

Also create a file named `.igdeploy` in the following format:

```json
{
  "username": "John.Smith",
  "password": "kittenz"
}
```

You can put your `.igdeploy` in any ascendant directory of your project, eg, your home directory. (Or you can put it directly in your project directory, but be careful not to commit it!)

Then run: `grunt igdeploy:staging`. This will upload `./dist` to replace `/web/staging` on the server.

Note: the .igdeploy file will be automatically merged into the task config, so you can also include other options here too.


## More options

### `targetRoot`
If all your target paths share a long prefix, you can do this:

```js
  igdeploy: {
    options: {
      src: 'dist',
      server: 'example.com',
      targetRoot: '/long/path/to/remote/web/root',
      targets: {
        staging: 'staging',
        prod: 'prod',
        foobar: '/foo/bar'
      }
    }
  }
```

Now `grunt igdeploy:staging` will upload `./dist` to `/long/path/to/remote/web/root/staging`.

Note: if a target path begins with a `/`, it will be considered absolute, and will never be prefixed with the `targetRoot`. So in the above example, `grunt igdeploy:foobar` will upload `./dist` to `/foo/bar`.


### Ad hoc targets

> This feature is not yet implemented!

```js
  igdeploy: {
    options: {
      src: 'dist',
      server: 'example.com',
      targetRoot: '/long/path/to/remote/web/root',
      adHocTargets: true
    }
  }
```

If you enable `adHocTargets`, you'll be allowed to specify a custom subdirectory name whenever you run the task, without it being pre-defined as a target. For example `grunt igdeploy:v12-demo` will upload `./dist` to `/long/path/to/remote/web/root/v12-demo`.

NB: if you specify named `targets` as well as allowing ad hoc targets, the named targets will take precedence. So if you did `grunt igdeploy:foo`, it will first look for a target named `foo`, then if not found, it will just upload it as a folder called `foo`.
