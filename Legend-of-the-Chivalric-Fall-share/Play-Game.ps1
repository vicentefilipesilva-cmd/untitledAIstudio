param(
  [switch]$NoBrowser
)

$ErrorActionPreference = 'Stop'
$root = [System.IO.Path]::GetFullPath($PSScriptRoot)
$listener = $null

try {
  for ($port = 4173; $port -lt 4273; $port++) {
    $candidate = New-Object System.Net.Sockets.TcpListener([System.Net.IPAddress]::Loopback, $port)
    try {
      $candidate.Start()
      $listener = $candidate
      break
    } catch {
      $candidate.Stop()
    }
  }

  if (-not $listener) {
    throw 'Could not find an available local port between 4173 and 4272.'
  }

  $address = "http://127.0.0.1:$port/"
  Write-Host 'Starting the game. Keep this window open while you play.' -ForegroundColor Cyan
  Write-Host "Game address: $address"
  Write-Host 'Press Ctrl+C here when you are finished.'
  if (-not $NoBrowser) {
    Start-Process $address
  }

  while ($true) {
    $client = $listener.AcceptTcpClient()
    try {
      $stream = $client.GetStream()
      $reader = New-Object System.IO.StreamReader($stream, [System.Text.Encoding]::ASCII, $false, 1024, $true)
      $requestLine = $reader.ReadLine()
      while ($null -ne ($header = $reader.ReadLine()) -and $header.Length -gt 0) { }

      $method = ''
      $requestPath = '/'
      if ($requestLine -match '^(GET|HEAD)\s+(\S+)\s+HTTP/') {
        $method = $Matches[1]
        $requestPath = $Matches[2].Split('?')[0]
      }

      $relativePath = [System.Uri]::UnescapeDataString($requestPath.TrimStart('/')).Replace('/', [System.IO.Path]::DirectorySeparatorChar)
      if ([string]::IsNullOrWhiteSpace($relativePath)) {
        $relativePath = 'index.html'
      }

      $filePath = [System.IO.Path]::GetFullPath((Join-Path $root $relativePath))
      if (-not $filePath.StartsWith($root + [System.IO.Path]::DirectorySeparatorChar, [System.StringComparison]::OrdinalIgnoreCase)) {
        $filePath = ''
      }

      if (($method -ne 'GET' -and $method -ne 'HEAD') -or -not $filePath -or -not (Test-Path -LiteralPath $filePath -PathType Leaf)) {
        $status = '404 Not Found'
        $body = [System.Text.Encoding]::UTF8.GetBytes('Not found')
        $contentType = 'text/plain; charset=utf-8'
      } else {
        $status = '200 OK'
        $extension = [System.IO.Path]::GetExtension($filePath).ToLowerInvariant()
        $contentType = switch ($extension) {
          '.html' { 'text/html; charset=utf-8' }
          '.js' { 'text/javascript; charset=utf-8' }
          '.css' { 'text/css; charset=utf-8' }
          '.json' { 'application/json; charset=utf-8' }
          '.png' { 'image/png' }
          '.jpg' { 'image/jpeg' }
          '.jpeg' { 'image/jpeg' }
          '.jfif' { 'image/jpeg' }
          '.svg' { 'image/svg+xml' }
          '.ico' { 'image/x-icon' }
          default { 'application/octet-stream' }
        }
        $body = [System.IO.File]::ReadAllBytes($filePath)
      }

      $headers = "HTTP/1.1 $status`r`nContent-Type: $contentType`r`nContent-Length: $($body.Length)`r`nCache-Control: no-store`r`nConnection: close`r`n`r`n"
      $headerBytes = [System.Text.Encoding]::ASCII.GetBytes($headers)
      $stream.Write($headerBytes, 0, $headerBytes.Length)
      if ($method -ne 'HEAD') {
        $stream.Write($body, 0, $body.Length)
      }
      $stream.Flush()
    } catch {
      Write-Warning "Unable to serve a game file: $($_.Exception.Message)"
    } finally {
      if ($client) {
        $client.Close()
      }
    }
  }
} catch {
  Write-Error $_
  exit 1
} finally {
  if ($listener) {
    $listener.Stop()
  }
}
