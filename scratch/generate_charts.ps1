$songlistPath = "data\songlist.json"
$songlist = Get-Content $songlistPath -Raw | ConvertFrom-Json

$durationMs = 600000 # 10 mins

foreach ($song in $songlist) {
    $chartPath = $song.chartFile
    $chartData = [ordered]@{
        song = $song.name
        bpm = $song.bpm
        scrollSpeed = $song.scrollSpeed
        events = @()
        notes = @()
    }

    if (Test-Path $chartPath) {
        $existingData = Get-Content $chartPath -Raw | ConvertFrom-Json
        if ($existingData.events) {
            foreach ($e in $existingData.events) {
                if ($e.type -ne 'mirror') {
                    $chartData.events += $e
                }
            }
        }
    }

    $msPerBeat = 60000 / $song.bpm
    $time = 3000

    $beatCount = 0
    while ($time -lt $durationMs) {
        $lane = 0
        $type = 'tap'
        $duration = 0

        $beatInMeasure = $beatCount % 4

        if ($beatInMeasure -eq 0) {
            $lane = 0
        } elseif ($beatInMeasure -eq 2) {
            $lane = 2
        } else {
            $rand = Get-Random -Minimum 0 -Maximum 100
            if ($rand -gt 50) { $lane = 1 } else { $lane = 3 }
            
            $rand2 = Get-Random -Minimum 0 -Maximum 100
            if ($rand2 -gt 80) {
                $type = 'sustain'
                $duration = [math]::Round($msPerBeat * 0.8)
            }
        }

        $note = [ordered]@{
            time = [math]::Round($time)
            lane = $lane
            type = $type
        }
        if ($duration -gt 0) {
            $note.duration = $duration
        }
        $chartData.notes += $note

        $rand3 = Get-Random -Minimum 0 -Maximum 100
        if ($rand3 -gt 70) {
            $extraNote = [ordered]@{
                time = [math]::Round($time + $msPerBeat / 2)
                lane = ($lane + 1) % 4
                type = 'tap'
            }
            $chartData.notes += $extraNote
        }

        $time += $msPerBeat
        $beatCount++
    }

    $chartData | ConvertTo-Json -Depth 10 | Set-Content $chartPath
    Write-Host "Generated chart for $($song.name)"
}
