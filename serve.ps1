param([int]$Port = 3333, [string]$Root = $PSScriptRoot)
$listener = [System.Net.HttpListener]::new()
$listener.Prefixes.Add("http://localhost:$Port/")
$listener.Start()
Write-Host "Serving $Root on http://localhost:$Port"
while ($listener.IsListening) {
    $ctx  = $listener.GetContext()
    $req  = $ctx.Request
    $resp = $ctx.Response
    $path = $req.Url.LocalPath.TrimStart('/').Replace('/', [System.IO.Path]::DirectorySeparatorChar)
    if ($path -eq '') { $path = 'index.html' }
    $file = Join-Path $Root $path
    if (Test-Path $file -PathType Leaf) {
        $mime = switch ([System.IO.Path]::GetExtension($file)) {
            '.html' { 'text/html; charset=utf-8' }
            '.css'  { 'text/css' }
            '.js'   { 'application/javascript' }
            '.json' { 'application/json' }
            default { 'application/octet-stream' }
        }
        $bytes = [System.IO.File]::ReadAllBytes($file)
        $resp.ContentType  = $mime
        $resp.SendChunked  = $true
        $resp.OutputStream.Write($bytes, 0, $bytes.Length)
    } else {
        $resp.StatusCode = 404
    }
    $resp.OutputStream.Close()
}
