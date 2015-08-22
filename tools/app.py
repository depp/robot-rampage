# Copyright 2015 Dietrich Epp.
#
# This file is part of Robot Rampage.  The Robot Rampage source
# code is distributed under the terms of the MIT license.
# See LICENSE.txt for details.
from . import build
from . import version
from mako import template
import json
import os
import tempfile

class App(object):
    __slots__ = ['config', 'system', 'scale']

    def __init__(self, config, system):
        self.config = config
        self.system = system
        self.scale = 2

    def build(self):
        ver = version.get_version('.')

        scripts = [
            self.system.build_module(
                'build/lodash.js',
                'lodash-cli',
                self.lodash_js),
            self.system.build_module(
                'build/howler.js',
                'howler',
                self.howler_js),
            self.system.build_module(
                'build/three.js',
                'three',
                self.three_js),
            self.system.build(
                'build/app.js',
                self.app_js,
                deps=build.all_files('src', exts={'.js'}),
                bust=True),
        ]

        self.system.build(
            'build/index.html',
            self.index_html,
            deps=[
                'static/index.mak',
                'static/style.css',
                'static/load.js',
            ],
            args=[scripts, ver])

    def lodash_js(self):
        with tempfile.TemporaryDirectory() as path:
            build.run_pipe(
                ['./node_modules/.bin/lodash',
                 'modern', '-o', os.path.join(path, 'lodash.js')])
            with open(os.path.join(path, 'lodash.min.js'), 'rb') as fp:
                return fp.read()

    def howler_js(self):
        with open('./node_modules/howler/howler.min.js', 'rb') as fp:
            return fp.read()

    def three_js(self):
        with open('./node_modules/three/three.min.js', 'rb') as fp:
            return fp.read()

    def app_js(self):
        return build.minify_js(
            self.config,
            build.browserify(self.config, ['./src/app']))

    def index_css(self):
        """Get the main CSS styles."""
        with open('static/style.css', 'rb') as fp:
            data = fp.read()
        return build.minify_css(self.config, data).decode('UTF-8')

    def index_js(self, scripts):
        """Get the JavaScript loader code."""
        with open('static/load.js') as fp:
            data = fp.read()
        scripts = [os.path.relpath(path, 'build/') for path in scripts]
        return build.minify_js(
            self.config,
            data.replace(
                'var SCRIPTS = [];',
                'var SCRIPTS = {};'.format(
                    json.dumps(scripts, separators=(',', ':'))))
            .encode('UTF-8')).decode('UTF-8')

    def index_html(self, scripts, ver):
        """Get the main HTML page."""
        def relpath(path):
            return os.path.relpath(path, 'build/')
        tmpl = template.Template(filename='static/index.mak')
        data = tmpl.render(
            relpath=relpath,
            scripts=scripts,
            css_data=self.index_css(),
            js_data=self.index_js(scripts),
            app_name='Robot Rampage',
            version=ver,
        )
        return build.minify_html(self.config, data.encode('UTF-8'))
