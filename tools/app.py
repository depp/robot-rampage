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
import re
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

        path_map = {}
        self.build_models(path_map)
        self.build_audio(path_map, 'sfx')
        self.build_images(path_map)

        self.system.build(
            'build/index.html',
            self.index_html,
            deps=[
                'static/index.mak',
                'static/style.css',
                'static/load.js',
            ],
            args=[scripts, ver, path_map])

    def build_models(self, path_map):
        """Build all models, adding them to the path map."""
        model_paths = {}
        in_root = 'assets/models'
        out_root = 'build/assets/models'
        for path in build.all_files(in_root, exts={'.json'}):
            relpath = os.path.relpath(path, in_root)
            model_path = self.system.copy(
                os.path.join(out_root, relpath),
                path,
                bust=True)
            name = os.path.splitext(relpath)[0]
            model_paths[name] = os.path.relpath(
                os.path.splitext(model_path)[0], out_root)
        path_map['models'] = model_paths

    def build_audio(self, path_map, dirname):
        """Build the sound effects, adding them to the path map."""
        audio_files = {}
        in_root = os.path.join('assets', dirname)
        out_root = os.path.join('build/assets', dirname)
        sort_order = ['.ogg', '.m4a']
        for path in build.all_files(in_root, exts=set(sort_order)):
            relpath = os.path.relpath(path, in_root)
            name = os.path.splitext(relpath)[0];
            out_path = self.system.copy(
                os.path.join(out_root, relpath),
                path,
                bust=True)
            out_rel = os.path.relpath(out_path, out_root)
            try:
                audio_files[name].append(out_rel)
            except KeyError:
                audio_files[name] = [out_rel]
        for flist in audio_files.values():
            flist.sort(
                key=lambda x: sort_order.index(os.path.splitext(x)[1]))
        path_map[dirname] = audio_files

    def build_images(self, path_map):
        """Build the images."""
        images = {}
        in_root = 'assets/images'
        out_root = 'build/assets/images'
        for path in build.all_files(in_root, exts={'.png', '.jpg'}):
            relpath = os.path.relpath(path, in_root)
            name = os.path.splitext(relpath)[0]
            out_path = self.system.copy(
                os.path.join(out_root, relpath),
                path,
                bust=True)
            out_rel = os.path.relpath(out_path, out_root)
            images[name] = out_rel
        path_map['images'] = images

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

    def index_js(self, scripts, path_map):
        """Get the JavaScript loader code."""
        with open('static/load.js') as fp:
            data = fp.read()
        scripts = [os.path.relpath(path, 'build/') for path in scripts]
        repls = {
            'SCRIPTS': scripts,
            'PATH_MAP': path_map,
        }
        def repl(m):
            name = m.group(1)
            value = json.dumps(repls[name], separators=(',', ':'),
                               sort_keys=True)
            return 'var {} = {};'.format(name, repls[name])
        data = re.sub(r'var ([\w]+) = null;', repl, data)
        return build.minify_js(
            self.config, data.encode('UTF-8')).decode('UTF-8')

    def index_html(self, scripts, ver, path_map):
        """Get the main HTML page."""
        def relpath(path):
            return os.path.relpath(path, 'build/')
        tmpl = template.Template(filename='static/index.mak')
        data = tmpl.render(
            relpath=relpath,
            scripts=scripts,
            css_data=self.index_css(),
            js_data=self.index_js(scripts, path_map),
            app_name='Robot Rampage',
            version=ver,
        )
        return build.minify_html(self.config, data.encode('UTF-8'))
