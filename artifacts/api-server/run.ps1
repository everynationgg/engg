$env:NODE_ENV='development'
Get-Content .env | ForEach-Object {
    if ($_ -match '^(.*?)=(.*)$') {
        $name = $matches[1]
        $value = $matches[2]
        Set-Item -Path "env:$name" -Value $value
    }
}
pnpm run start
