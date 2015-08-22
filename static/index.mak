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
	(Blurb goes here.)
      </p>
      <h3>Controls</h3>
      <ul class="controls">
	<li><span>A:</span> do the A thing</li>
	<li><span>B:</span> do the B thing</li>
      </ul>
      <h3>Links</h3>
      <ul class="links">
	<li><a href="http://www.example.com/">Example</a></li>
	<li><a href="http://www.example.com/">Example 2</a></li>
      </ul>
    </div>
    <script type="text/javascript">${js_data}</script>
  </body>
</html>
