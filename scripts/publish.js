const { spawn } = require('child_process')
const path = require('path')
require('dotenv').config()

if (!process.env.GH_TOKEN) {
  console.error('Error: GH_TOKEN is not set in .env file')
  process.exit(1)
}

console.log('Starting build and publish process...')

// Set PAGER=cat to avoid interactive paging in spawned processes
process.env.PAGER = 'cat'

const build = spawn('npm', ['run', 'build'], {
  shell: true,
  stdio: 'inherit'
})

build.on('close', (code) => {
  if (code !== 0) {
    console.error(`Build failed with code ${code}`)
    process.exit(code)
  }

  console.log('Build successful. Starting publishing...')

  const publish = spawn('npx', ['electron-builder', '--win', '--x64', '--publish=always'], {
    shell: true,
    stdio: 'inherit',
    env: { ...process.env } // Ensure the loaded GH_TOKEN is passed
  })

  publish.on('close', (publishCode) => {
    if (publishCode !== 0) {
      console.error(`Publishing failed with code ${publishCode}`)
      process.exit(publishCode)
    }
    console.log('Successfully published to GitHub!')
  })
})
