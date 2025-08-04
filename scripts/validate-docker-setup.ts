#!/usr/bin/env tsx

/**
 * ReadZone Docker Setup Validation Script
 * Validates Docker configuration and deployment readiness
 */

import { execSync } from 'child_process'
import { existsSync, readFileSync, statSync } from 'fs'
import { join } from 'path'

interface ValidationResult {
  name: string
  status: 'pass' | 'fail' | 'warning'
  message: string
}

class DockerValidator {
  private results: ValidationResult[] = []

  private addResult(name: string, status: 'pass' | 'fail' | 'warning', message: string) {
    this.results.push({ name, status, message })
  }

  private runCommand(command: string, silent: boolean = true): string | null {
    try {
      return execSync(command, { 
        stdio: silent ? 'pipe' : 'inherit',
        encoding: 'utf8'
      }).toString().trim()
    } catch (error) {
      return null
    }
  }

  private checkFileExists(filePath: string, description: string): boolean {
    const exists = existsSync(filePath)
    this.addResult(
      `File: ${description}`,
      exists ? 'pass' : 'fail',
      exists ? `✅ ${filePath} exists` : `❌ ${filePath} missing`
    )
    return exists
  }

  async validateDockerFiles() {
    console.log('🐳 Validating Docker configuration files...')
    
    const dockerFiles = [
      { path: 'Dockerfile', description: 'Main Dockerfile' },
      { path: 'docker-compose.yml', description: 'Development compose file' },
      { path: 'docker-compose.staging.yml', description: 'Staging compose file' },
      { path: 'docker-compose.production.yml', description: 'Production compose file' },
      { path: '.dockerignore', description: 'Docker ignore file' }
    ]

    let allFilesPresent = true
    for (const file of dockerFiles) {
      const exists = this.checkFileExists(file.path, file.description)
      if (!exists) allFilesPresent = false
    }

    return allFilesPresent
  }

  async validateDockerConfiguration() {
    console.log('⚙️ Validating Docker configuration...')
    
    // Check if Docker is installed and running
    const dockerVersion = this.runCommand('docker --version')
    this.addResult(
      'Docker Installation',
      dockerVersion ? 'pass' : 'fail',
      dockerVersion ? `✅ Docker installed: ${dockerVersion}` : '❌ Docker not installed or not accessible'
    )

    // Check if Docker Compose is available
    const composeVersion = this.runCommand('docker compose version')
    this.addResult(
      'Docker Compose',
      composeVersion ? 'pass' : 'fail',
      composeVersion ? `✅ Docker Compose available: ${composeVersion}` : '❌ Docker Compose not available'
    )

    // Validate Dockerfile syntax (basic check)
    if (existsSync('Dockerfile')) {
      const dockerfileContent = readFileSync('Dockerfile', 'utf8')
      const hasValidStructure = dockerfileContent.includes('FROM') && 
                               dockerfileContent.includes('CMD')
      this.addResult(
        'Dockerfile Syntax',
        hasValidStructure ? 'pass' : 'fail',
        hasValidStructure ? '✅ Dockerfile has valid structure' : '❌ Dockerfile missing FROM or CMD instructions'
      )
    }

    return dockerVersion && composeVersion
  }

  async validateNextjsConfiguration() {
    console.log('⚡ Validating Next.js Docker configuration...')
    
    // Check if next.config.mjs has standalone output
    if (existsSync('next.config.mjs')) {
      const configContent = readFileSync('next.config.mjs', 'utf8')
      const hasStandalone = configContent.includes("output: 'standalone'")
      this.addResult(
        'Next.js Standalone Output',
        hasStandalone ? 'pass' : 'fail',
        hasStandalone ? '✅ Standalone output configured' : '❌ Standalone output not configured'
      )
    }

    // Check if health endpoint exists
    const healthEndpoint = 'src/app/api/health/route.ts'
    const hasHealthCheck = this.checkFileExists(healthEndpoint, 'Health check endpoint')

    return hasHealthCheck
  }

  async validateSecurityConfiguration() {
    console.log('🔒 Validating Docker security configuration...')
    
    // Check .dockerignore for security best practices
    if (existsSync('.dockerignore')) {
      const dockerignoreContent = readFileSync('.dockerignore', 'utf8')
      
      const securityItems = [
        '.env',
        '*.key',
        '*.pem',
        '.github/',
        'scripts/',
        'tests/'
      ]

      let secureItems = 0
      for (const item of securityItems) {
        if (dockerignoreContent.includes(item)) {
          secureItems++
        }
      }

      const securityScore = secureItems / securityItems.length
      this.addResult(
        'Docker Security (.dockerignore)',
        securityScore >= 0.8 ? 'pass' : securityScore >= 0.6 ? 'warning' : 'fail',
        `${securityScore >= 0.8 ? '✅' : securityScore >= 0.6 ? '⚠️' : '❌'} Security items excluded: ${secureItems}/${securityItems.length}`
      )
    }

    // Check Dockerfile for security best practices
    if (existsSync('Dockerfile')) {
      const dockerfileContent = readFileSync('Dockerfile', 'utf8')
      
      const securityPractices = [
        { pattern: /USER nextjs/, name: 'Non-root user' },
        { pattern: /HEALTHCHECK/, name: 'Health check' },
        { pattern: /alpine/, name: 'Minimal base image' },
        { pattern: /--no-cache/, name: 'Package manager cache cleanup' }
      ]

      let securityPassed = 0
      for (const practice of securityPractices) {
        if (practice.pattern.test(dockerfileContent)) {
          securityPassed++
          this.addResult(
            `Security: ${practice.name}`,
            'pass',
            `✅ ${practice.name} implemented`
          )
        } else {
          this.addResult(
            `Security: ${practice.name}`,
            'warning',
            `⚠️ ${practice.name} not found`
          )
        }
      }

      return securityPassed >= 3
    }

    return false
  }

  async validateBuildOptimization() {
    console.log('🚀 Validating build optimization...')
    
    // Check for multi-stage build
    if (existsSync('Dockerfile')) {
      const dockerfileContent = readFileSync('Dockerfile', 'utf8')
      
      const hasMultiStage = dockerfileContent.includes('FROM') && 
                           (dockerfileContent.match(/FROM/g) || []).length >= 3
      this.addResult(
        'Multi-stage Build',
        hasMultiStage ? 'pass' : 'warning',
        hasMultiStage ? '✅ Multi-stage build configured' : '⚠️ Single stage build - consider multi-stage for optimization'
      )

      // Check for layer optimization
      const hasLayerOptimization = dockerfileContent.includes('npm ci') &&
                                   dockerfileContent.includes('COPY package')
      this.addResult(
        'Layer Optimization',
        hasLayerOptimization ? 'pass' : 'warning',
        hasLayerOptimization ? '✅ Package files copied before source code' : '⚠️ Consider optimizing Docker layers'
      )

      return hasMultiStage
    }

    return false
  }

  async testDockerBuild() {
    console.log('🔨 Testing Docker build (optional)...')
    
    if (!existsSync('Dockerfile')) {
      this.addResult('Docker Build Test', 'fail', '❌ Dockerfile not found')
      return false
    }

    console.log('  Building Docker image (this may take a few minutes)...')
    const buildResult = this.runCommand('docker build -t readzone-test . 2>&1', false)
    
    if (buildResult && !buildResult.includes('ERROR')) {
      this.addResult('Docker Build Test', 'pass', '✅ Docker image builds successfully')
      
      // Cleanup test image
      this.runCommand('docker rmi readzone-test 2>/dev/null', true)
      return true
    } else {
      this.addResult('Docker Build Test', 'fail', '❌ Docker build failed')
      return false
    }
  }

  async runValidation(skipBuild: boolean = true) {
    console.log('🚀 Starting ReadZone Docker Setup Validation...\n')

    const validations = [
      await this.validateDockerFiles(),
      await this.validateDockerConfiguration(),
      await this.validateNextjsConfiguration(),
      await this.validateSecurityConfiguration(),
      await this.validateBuildOptimization()
    ]

    // Optional build test
    if (!skipBuild) {
      validations.push(await this.testDockerBuild())
    }

    // Print results
    console.log('\n📊 Validation Results:')
    console.log('='.repeat(60))
    
    let passCount = 0
    let failCount = 0
    let warningCount = 0

    for (const result of this.results) {
      const icon = result.status === 'pass' ? '✅' : result.status === 'fail' ? '❌' : '⚠️'
      console.log(`${icon} ${result.name}: ${result.message}`)
      
      if (result.status === 'pass') passCount++
      else if (result.status === 'fail') failCount++
      else warningCount++
    }

    console.log('\n📈 Summary:')
    console.log(`✅ Passed: ${passCount}`)
    console.log(`❌ Failed: ${failCount}`)
    console.log(`⚠️  Warnings: ${warningCount}`)

    const overallSuccess = failCount === 0 && passCount > warningCount

    if (overallSuccess) {
      console.log('\n🎉 Docker setup validation PASSED! Ready for deployment.')
      console.log('\n🚀 Next steps:')
      console.log('  • Test build: npm run docker:build')
      console.log('  • Run locally: docker compose up')
      console.log('  • Deploy staging: docker compose -f docker-compose.staging.yml up')
    } else {
      console.log('\n⚠️  Docker setup validation found issues. Please resolve before deployment.')
    }

    return overallSuccess
  }
}

// Run validation if called directly
if (require.main === module) {
  const skipBuild = process.argv.includes('--skip-build')
  const validator = new DockerValidator()
  
  validator.runValidation(skipBuild).then(success => {
    process.exit(success ? 0 : 1)
  }).catch(error => {
    console.error('Docker validation failed:', error)
    process.exit(1)
  })
}

export default DockerValidator