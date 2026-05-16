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

    $diff = $song.difficulty
    if ($null -eq $diff) { $diff = 3 }

    # Difficulty modifiers
    $chance8th = 50 + ($diff * 10)  # max 100 for diff 5
    $chance16th = ($diff - 3) * 20  # diff 3: 0, diff 4: 20, diff 5: 40
    $chanceDouble = ($diff - 2) * 15 # diff 3: 15, diff 4: 30, diff 5: 45

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

        # Double note on same beat
        $randDouble = Get-Random -Minimum 0 -Maximum 100
        if ($randDouble -lt $chanceDouble) {
            $doubleLane = ($lane + 2) % 4
            $doubleNote = [ordered]@{
                time = [math]::Round($time)
                lane = $doubleLane
                type = 'tap'
            }
            $chartData.notes += $doubleNote
        }

        # 8th note
        $rand8th = Get-Random -Minimum 0 -Maximum 100
        if ($rand8th -lt $chance8th) {
            $extraLane = ($lane + 1) % 4
            $extraNote = [ordered]@{
                time = [math]::Round($time + $msPerBeat / 2)
                lane = $extraLane
                type = 'tap'
            }
            $chartData.notes += $extraNote

            # 16th notes (between quarter and 8th, or 8th and next quarter)
            $rand16th = Get-Random -Minimum 0 -Maximum 100
            if ($rand16th -lt $chance16th) {
                $sixteenthLane = ($extraLane + 1) % 4
                $sixteenthNote = [ordered]@{
                    time = [math]::Round($time + $msPerBeat / 4)
                    lane = $sixteenthLane
                    type = 'tap'
                }
                $chartData.notes += $sixteenthNote
            }
        }

        $time += $msPerBeat
        $beatCount++
    }

    # Sort notes by time just in case
    # Actually they are generated mostly sequentially, but 16th notes might be out of order in the array
    # We will let the game NoteManager sort them if needed, wait, NoteManager already sorts them!
    # $this.notes = chartData.notes.sort((a, b) => a.time - b.time); in NoteManager.js

    $chartData | ConvertTo-Json -Depth 10 | Set-Content $chartPath
    Write-Host "Generated chart for $($song.name) with diff $($diff)"
}
