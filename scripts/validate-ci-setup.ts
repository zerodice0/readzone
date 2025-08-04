#!/usr/bin/env tsx

/**
 * ReadZone CI Setup Validation Script
 * Validates that all CI components are properly configured
 */

import { execSync } from 'child_process'
import { existsSync, readFileSync } from 'fs'
import { join } from 'path'

interface ValidationResult {
  name: string
  status: 'pass' | 'fail' | 'warning'
  message: string
}

class CIValidator {
  private results: ValidationResult[] = []

  private addResult(name: string, status: 'pass' | 'fail' | 'warning', message: string) {
    this.results.push({ name, status, message })
  }

  private runCommand(command: string, errorMessage: string): boolean {
    try {
      execSync(command, { stdio: 'pipe' })
      return true
    } catch (error) {
      console.error(`Error running ${command}:`, errorMessage)
      return false
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

  async validatePackageScripts() {
    console.log('📦 Validating package.json scripts...')
    
    const packageJson = JSON.parse(readFileSync('package.json', 'utf8'))
    const requiredScripts = [
      'type-check',
      'lint',
      'format',
      'test:unit',
      'test:coverage',
      'test:e2e',
      'test:security',
      'test:compliance',
      'test:penetration',
      'test:rbac-security',
      'build',
      'db:generate',
      'db:push',
      'db:seed'
    ]

    let allScriptsPresent = true
    for (const script of requiredScripts) {
      const exists = packageJson.scripts && packageJson.scripts[script]
      this.addResult(
        `Script: ${script}`,
        exists ? 'pass' : 'fail',
        exists ? `✅ ${script} defined` : `❌ ${script} missing`
      )
      if (!exists) allScriptsPresent = false
    }

    return allScriptsPresent
  }

  async validateConfigFiles() {
    console.log('⚙️ Validating configuration files...')
    
    const configFiles = [
      { path: 'jest.config.js', description: 'Jest configuration' },
      { path: 'playwright.config.ts', description: 'Playwright configuration' },
      { path: 'jest.setup.js', description: 'Jest setup file' },
      { path: 'tests/global-setup.ts', description: 'Playwright global setup' },
      { path: 'tests/global-teardown.ts', description: 'Playwright global teardown' },
      { path: 'prisma/schema.prisma', description: 'Prisma schema' },
      { path: '.github/workflows/ci.yml', description: 'CI workflow' },
      { path: '.github/dependabot.yml', description: 'Dependabot configuration' }
    ]

    let allConfigsPresent = true
    for (const config of configFiles) {
      const exists = this.checkFileExists(config.path, config.description)
      if (!exists) allConfigsPresent = false
    }

    return allConfigsPresent
  }

  async validateTestStructure() {
    console.log('🧪 Validating test structure...')
    
    const testDirectories = [
      'tests/security',
      'tests/rbac', 
      'tests/admin',
      'tests/e2e',
      'tests/integration',
      'src/lib/__tests__',
      'src/app/api/**/__tests__'
    ]

    // Check if test files exist
    let hasTests = false
    try {
      const testFiles = execSync('find . -name "*.test.ts" -o -name "*.spec.ts" | grep -v node_modules | head -5', { encoding: 'utf8' })
      hasTests = testFiles.trim().length > 0
      this.addResult(
        'Test Files',
        hasTests ? 'pass' : 'warning',
        hasTests ? '✅ Test files found' : '⚠️ Few test files found'
      )
    } catch (error) {
      this.addResult('Test Files', 'fail', '❌ Could not locate test files')
    }

    return hasTests
  }

  async validateDependencies() {
    console.log('📚 Validating dependencies...')
    
    const requiredDeps = [
      '@playwright/test',
      'jest',
      '@testing-library/jest-dom',
      '@testing-library/react',
      'prisma',
      '@prisma/client'
    ]

    const packageJson = JSON.parse(readFileSync('package.json', 'utf8'))
    const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies }

    let allDepsPresent = true
    for (const dep of requiredDeps) {
      const exists = allDeps[dep]
      this.addResult(
        `Dependency: ${dep}`,
        exists ? 'pass' : 'fail',
        exists ? `✅ ${dep} installed` : `❌ ${dep} missing`
      )
      if (!exists) allDepsPresent = false
    }

    return allDepsPresent
  }

  async validateCIWorkflow() {
    console.log('🔄 Validating CI workflow...')
    
    try {
      const ciContent = readFileSync('.github/workflows/ci.yml', 'utf8')
      
      // Check for required jobs
      const requiredJobs = [
        'quality-check',
        'unit-tests', 
        'security-tests',
        'e2e-tests',
        'build-validation'
      ]

      let allJobsPresent = true
      for (const job of requiredJobs) {
        const hasJob = ciContent.includes(`${job}:`)
        this.addResult(
          `CI Job: ${job}`,
          hasJob ? 'pass' : 'fail',
          hasJob ? `✅ ${job} job defined` : `❌ ${job} job missing`
        )
        if (!hasJob) allJobsPresent = false
      }

      return allJobsPresent
    } catch (error) {
      this.addResult('CI Workflow', 'fail', '❌ Could not read CI workflow file')
      return false
    }
  }

  async runValidation() {
    console.log('🚀 Starting ReadZone CI Setup Validation...\n')

    const validations = [
      await this.validateConfigFiles(),
      await this.validatePackageScripts(),
      await this.validateTestStructure(),
      await this.validateDependencies(),
      await this.validateCIWorkflow()
    ]

    // Print results
    console.log('\n📊 Validation Results:')
    console.log('='.repeat(50))
    
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

    const overallSuccess = validations.every(v => v === true) && failCount === 0
    
    if (overallSuccess) {
      console.log('\n🎉 CI setup validation PASSED! Ready for Phase 3.')
    } else {
      console.log('\n⚠️  CI setup validation found issues. Please resolve before proceeding.')
    }

    return overallSuccess
  }
}

// Run validation if called directly
if (require.main === module) {
  const validator = new CIValidator()
  validator.runValidation().then(success => {
    process.exit(success ? 0 : 1)
  }).catch(error => {
    console.error('Validation failed:', error)
    process.exit(1)
  })
}

export default CIValidator