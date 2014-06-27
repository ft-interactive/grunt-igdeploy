# grunt-igdeploy

> A grunt task to deploy to the FTI static content server. (Intended for internal FT use; may or may not work on your server.)


## Basic usage

    npm install --save-dev grunt-igdeploy

```js
grunt.loadNpmTasks('grunt-igdeploy');

grunt.initConfig({
  igdeploy: {
    options: {
      src: 'dist',
      host: 'example.com',
      destPrefix: '/some/long/path/to/your/web/root'
    },

    staging: {
      options: {
        dest: 'your/staging/dir'
      }
    },

    production: {
      options: {
        dest: 'your/prod/dir'
      }
    }
  }
})
```

The `destPrefix` option will be used as the base for the `dest` option, i.e. `path.join(options.destPrefix, options.dest)`. (Exception: if any target's `dest` begins with a `/`, that `dest` will be considered absolute, and will not be prefixed with the `destPrefix`.)


You should also create a file named `.igdeploy` in the following format:

```json
{
  "username": "John.Smith",
  "password": "kittenz"
}
```

You can put your `.igdeploy` in any ascendant directory of your project, eg, your home directory. (Or you can put it directly in your project directory, but be careful not to commit it.)

The contents of your `.igdeploy` file will be merged into the options passed to [igdeploy](#). (But options specified in your gruntfile take priority). You can put any sensitive options in your `.igdeploy` file if you don't want to commit them. Note the options from `.igdeploy` are merged in *after* Grunt has resolved the options object for whatever target you're running – so you can't put target-specific options in the `.igdeploy` file.



### Running it

Then run: `grunt igdeploy:staging`.

In the above example, this would upload `./dist` to `/some/long/path/to/your/web/root/foo/staging` on `example.com`.

If the target directory already exists, it will be renamed with `__IGDEPLOY_OLD` after it.

If you set the option `undo: true`, this will put igdeploy into 'undo mode'. This means it doesn't upload anything; instead it just looks for the `[yourpath]__IGDEPLOY_OLD` folder and swaps it with the `[yourpath]` folder. So you only get one chance to `undo` – subsequent runs will just undo the undo. Like Photoshop.
