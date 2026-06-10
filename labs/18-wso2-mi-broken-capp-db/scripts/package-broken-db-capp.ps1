$ErrorActionPreference = "Stop"

$Repo = (Resolve-Path (Join-Path $PSScriptRoot "..\..\..")).Path
$Source = Join-Path $Repo "labs\18-wso2-mi-broken-capp-db\source\broken-db-capp"
$OutputDir = Join-Path $Repo "labs\18-wso2-mi-broken-capp-db\capps\generated"
$Output = Join-Path $OutputDir "BrokenDbCompositeExporter_1.0.0.car"

Write-Host "Packaging broken DB CApp source ..."
New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null
Remove-Item -LiteralPath $Output -Force -ErrorAction SilentlyContinue

Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

$Zip = [System.IO.Compression.ZipFile]::Open($Output, [System.IO.Compression.ZipArchiveMode]::Create)
try {
    [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile(
        $Zip,
        (Join-Path $Source "artifacts.xml"),
        "artifacts.xml"
    ) | Out-Null

    Get-ChildItem -Path (Join-Path $Source "BrokenDatabaseAPI_1.0.0") -Recurse -File | ForEach-Object {
        $EntryName = $_.FullName.Substring($Source.Length + 1).Replace("\", "/")
        [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($Zip, $_.FullName, $EntryName) | Out-Null
    }
}
finally {
    $Zip.Dispose()
}

Write-Host "Created $Output"
