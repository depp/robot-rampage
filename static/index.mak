<!doctype html>
<html>
  <head>
    <meta charset="UTF-8">
    <title>${app_name|h}</title>
    <style type="text/css">${css_data|h}</style>
  </head>
  <body>
    <div id="main">
      <div id="game"></div>
      <p id="version">${version|h}</p>
    </div>
    <div id="instructions">
      <h1>${app_name|h}</h1>
      <p>
	Objective: DESTROY.  For Ludum Dare 33.
      </p>
      <h3>Controls</h3>
      <ul class="controls">
	<li><span>Arrow keys or WASD:</span> movement</li>
	<li><span>Spacebar:</span> shoot</li>
      </ul>
      <h3>Links</h3>
      <ul class="links">
	<li><a href="http://ludumdare.com/compo/ludum-dare-33/?action=preview&uid=7606">Ludum Dare project page</a></li>
	<li><a href="https://www.github.com/depp/robot-rampage">Source code on GitHub</a></li>
	<li><a href="https://soundcloud.com/twoseventwo">Soundtrack on SoundCloud</a></li>
	<li><a href="https://twitter.com/DietrichEpp">Twitter: @DietrichEpp</a>
      </ul>
    </div>
    <script type="text/javascript">${js_data}</script>
  </body>
</html>
