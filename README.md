# grunt-igdeploy

> A grunt task to handle deployment to the FTI static content server.

**None of this is implemented, it's just a rough plan for the task's API.**

## Basic usage
```js
grunt.loadNpmTasks('grunt-igdeploy');

grunt.initConfig({
  igdeploy: {
    src: './dist',
    server: 'example.com',
    targets: {
      staging: '/web/staging',
      production: '/web/prod'
    }
  }
})
```

Also create a file named `.igdeploy` (and `.gitignore` it!):

```json
{
  "username": "John.Smith",
  "password": "kittenz"
}
```

Then run: `grunt igdeploy:staging`. This will upload `./dist` to replace `/web/staging` on the server.

Note: the .igdeploy file will be automatically merged into the config, so you can include any other options in that file that you might want to hide away.


## More options

### `targetRoot`
If all your target paths share a long prefix, you can do this:

```js
  igdeploy: {
    src: './dist',
    server: 'example.com',
    targetRoot: '/long/path/to/remote/web/root',
    targets: {
      staging: 'staging',
      prod: 'prod'
    }
  }
```

Now `grunt igdeploy:staging` will upload `./dist` to `/long/path/to/remote/web/root/staging`.

Note: if a target path begins with a `/`, it will be considered absolute, and will never be prefixed with the `targetRoot`.


### Ad hoc targets
```js
  igdeploy: {
    src: './dist',
    server: 'example.com',
    targetRoot: '/long/path/to/remote/web/root',
    adHocTargets: true
  }
```

This way you can choose a subdirectory name at the time you run the task. For example `grunt igdeploy:v12-demo` will upload `./dist` to `/long/path/to/remote/web/root/v12-demo`.

NB: if you specify named `targets` as well as allowing ad hoc targets, the named targets will take precedence. So if you did `grunt igdeploy:foo`, it will first look for a target named `foo`, then if not found, it will just upload it as a folder called `foo`.


## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [Grunt](http://gruntjs.com/).


## Release History
_(Nothing yet)_


## License
Copyright (c) 2013 Callum Locke. Licensed under the None license.
