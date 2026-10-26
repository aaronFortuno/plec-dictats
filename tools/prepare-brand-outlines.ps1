Add-Type -AssemblyName System.Drawing
$projectRoot=Split-Path -Parent $PSScriptRoot
$layout=Get-Content -Raw -Encoding UTF8 -LiteralPath ($projectRoot+'/assets/brand/source-layout.json') | ConvertFrom-Json
$fontFamily=New-Object System.Drawing.FontFamily($layout.family)
$groups=@{}
foreach($partName in @('word','caption')){
  $part=$layout.$partName
  $fontStyle=if($partName -eq 'word'){[System.Drawing.FontStyle]::Bold}else{[System.Drawing.FontStyle]::Italic}
  $ascent=$fontFamily.GetCellAscent($fontStyle)*$part.size/$fontFamily.GetEmHeight($fontStyle)
  $glyphs=@()
  foreach($character in $part.characters){
    if($character.letter -eq ' '){continue}
    $glyphPath=New-Object System.Drawing.Drawing2D.GraphicsPath
    $origin=New-Object System.Drawing.PointF([single]$character.x,[single]($part.baseline-$ascent))
    $glyphPath.AddString([string]$character.letter,$fontFamily,[int]$fontStyle,[single]$part.size,$origin,[System.Drawing.StringFormat]::GenericTypographic)
    $points=@($glyphPath.PathPoints | ForEach-Object {,@([double]$_.X,[double]$_.Y)})
    $glyphs+=@{letter=$character.letter;points=$points;types=@($glyphPath.PathTypes | ForEach-Object {[int]$_})}
    $glyphPath.Dispose()
  }
  $groups[$partName]=$glyphs
}
$fontFamily.Dispose()
$groups | ConvertTo-Json -Depth 8 | Set-Content -Encoding utf8 -LiteralPath ($projectRoot+'/tmp/brand-outlines.json')
