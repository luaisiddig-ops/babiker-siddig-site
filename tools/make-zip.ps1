param(
    [Parameter(Mandatory=$true)][string]$SourceDir,
    [Parameter(Mandatory=$true)][string]$ZipPath
)

Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

if (Test-Path $ZipPath) { Remove-Item $ZipPath -Force }

$zip = [System.IO.Compression.ZipFile]::Open($ZipPath, [System.IO.Compression.ZipArchiveMode]::Create)

$sourceFull = (Resolve-Path $SourceDir).Path
$files = Get-ChildItem -Path $sourceFull -Recurse -File

foreach ($file in $files) {
    $relativePath = $file.FullName.Substring($sourceFull.Length + 1)
    $entryName = $relativePath -replace '\\', '/'
    [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $file.FullName, $entryName, [System.IO.Compression.CompressionLevel]::Optimal) | Out-Null
}

$zip.Dispose()
$count = $files.Count
$size = (Get-Item $ZipPath).Length
Write-Output ("Created {0}: {1} files, {2:N1} MB (forward-slash paths)" -f $ZipPath, $count, ($size/1MB))
