# Pull Request

## 📝 Description

<!-- Describe your changes in detail -->

## 🎯 Type of Change

- [ ] 🐛 Bug fix (non-breaking change which fixes an issue)
- [ ] ✨ New feature (non-breaking change which adds functionality)
- [ ] 💥 Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] 📚 Documentation update
- [ ] 🔧 Refactoring (no functional changes, no api changes)
- [ ] ⚡ Performance improvements
- [ ] 🧪 Test related changes
- [ ] 🏗️ Build system or external dependencies
- [ ] 🔒 Security improvements

## 🔗 Related Issues

<!-- Link any related issues here -->
Fixes #(issue)

## 🧪 Testing

<!-- Describe the tests that you ran to verify your changes -->

- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] E2E tests pass
- [ ] Manual testing completed

### Test Configuration
- **Environment**: <!-- dev/staging/production -->
- **Node.js version**: <!-- e.g., 18.x -->
- **Database**: <!-- PostgreSQL version -->

## 📸 Screenshots (if appropriate)

<!-- Add screenshots to help explain your changes -->

## ✅ Checklist

### Code Quality
- [ ] My code follows the style guidelines of this project
- [ ] I have performed a self-review of my own code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] My changes generate no new warnings or errors
- [ ] I have added JSDoc comments for new functions/methods

### Testing
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes
- [ ] I have checked that E2E tests pass

### Documentation
- [ ] I have made corresponding changes to the documentation
- [ ] I have updated the README.md if necessary
- [ ] I have updated the API documentation if necessary

### Security
- [ ] I have reviewed my code for potential security vulnerabilities
- [ ] I have not introduced any hardcoded secrets or credentials
- [ ] I have followed security best practices

### Performance
- [ ] I have considered the performance impact of my changes
- [ ] I have optimized database queries if applicable
- [ ] I have avoided introducing memory leaks

### Dependencies
- [ ] I have kept dependencies to a minimum
- [ ] New dependencies are justified and documented
- [ ] I have updated package.json/package-lock.json if needed

### Breaking Changes
- [ ] This PR does not introduce breaking changes
- [ ] If it does, I have documented the migration path
- [ ] I have updated the version number appropriately

## 🚀 Deployment Notes

<!-- Any special instructions for deploying this change -->

- [ ] Requires database migration
- [ ] Requires environment variable changes
- [ ] Requires manual deployment steps
- [ ] Safe to auto-deploy

### Environment Variables
<!-- List any new environment variables needed -->

### Database Changes
<!-- Describe any database schema changes -->

## 📋 Post-Deployment Checklist

<!-- Items to verify after deployment -->

- [ ] Feature works as expected in staging
- [ ] Performance metrics are acceptable
- [ ] Error rates are normal
- [ ] User feedback is positive

## 🤝 Reviewer Guidance

<!-- Help reviewers understand what to focus on -->

### Key Areas to Review
- [ ] Logic correctness
- [ ] Security implications
- [ ] Performance impact
- [ ] Code maintainability
- [ ] Test coverage

### Review Priority
- [ ] 🔴 High (security, critical bug fix)
- [ ] 🟡 Medium (new feature, enhancement)
- [ ] 🟢 Low (refactoring, documentation)

## 📚 Additional Context

<!-- Add any other context about the PR here -->

---

### For Maintainers

#### Merge Checklist
- [ ] All CI checks pass
- [ ] Code review completed
- [ ] Documentation updated
- [ ] Breaking changes documented
- [ ] Release notes updated

#### Post-Merge Actions
- [ ] Monitor deployment
- [ ] Update project board
- [ ] Notify stakeholders
- [ ] Close related issues