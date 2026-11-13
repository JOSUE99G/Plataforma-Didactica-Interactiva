si$ErrorActionPreference = "Stop"
$pages = @("modulos.html","practicas.html","recursos.html","evaluaciones.html","cinematica.html","progreso.html","quiz1.html","quiz2.html","matlab.html")

$faLink = '<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css">'

$replacements = @(
    @{ find = '<a href="dashboard.html">Inicio</a>'; replace = '<a href="dashboard.html"><i class="fa-solid fa-house"></i> Inicio</a>' },
    @{ find = '<a href="modulos.html">Módulos</a>'; replace = '<a href="modulos.html"><i class="fa-solid fa-book-open"></i> Módulos</a>' },
    @{ find = '<a href="practicas.html">Prácticas</a>'; replace = '<a href="practicas.html"><i class="fa-solid fa-flask"></i> Prácticas</a>' },
    @{ find = '<a href="recursos.html">Recursos</a>'; replace = '<a href="recursos.html"><i class="fa-solid fa-folder-open"></i> Recursos</a>' },
    @{ find = '<a href="evaluaciones.html">Evaluaciones</a>'; replace = '<a href="evaluaciones.html"><i class="fa-solid fa-clipboard-check"></i> Evaluaciones</a>' },
    @{ find = '<a href="visualizador.html">Modelo 3D</a>'; replace = '<a href="visualizador.html"><i class="fa-solid fa-cube"></i> Modelo 3D</a>' },
    @{ find = '<a href="matlab.html">Simulación MATLAB</a>'; replace = '<a href="matlab.html"><i class="fa-solid fa-terminal"></i> Simulación MATLAB</a>' },
    @{ find = '<a href="cinematica.html">Cinemática</a>'; replace = '<a href="cinematica.html"><i class="fa-solid fa-arrows-up-down-left-right"></i> Cinemática</a>' },
    @{ find = '<a href="progreso.html">Mi progreso</a>'; replace = '<a href="progreso.html"><i class="fa-solid fa-chart-line"></i> Mi progreso</a>' }
)

foreach ($page in $pages) {
    $content = Get-Content $page -Raw -Encoding UTF8

    # 1. Agregar Font Awesome si no existe
    if ($content -notmatch 'font-awesome') {
        $content = $content -replace [regex]::Escape('<link rel="stylesheet" href="assets/css/styles.css">'), ($faLink + "`r`n    " + '<link rel="stylesheet" href="assets/css/styles.css">')
    }

    # 2. Agregar íconos
    foreach ($r in $replacements) {
        $content = $content.Replace($r.find, $r.replace)
    }

    Set-Content $page -Value $content -Encoding UTF8 -NoNewline
    Write-Output "OK: $page"
}
Write-Output "DONE"
