# CI/CD Pipeline Documentation

## Overview

The Energia AI project implements a comprehensive CI/CD pipeline using GitHub Actions that includes:

- ✅ **Security Scanning**: Vulnerability detection, secrets scanning, dependency checks
- ✅ **Comprehensive Testing**: Unit, integration, and performance tests
- ✅ **Code Quality**: Linting, type checking, formatting
- ✅ **Docker Automation**: Container building and security scanning
- ✅ **Multi-Environment Deployment**: Development, staging, and production
- ✅ **Performance Monitoring**: Load testing and benchmarking
- ✅ **Automated Rollback**: Failure detection and recovery

## Workflow Files

### 1. Main CI/CD Pipeline (`.github/workflows/ci-cd-comprehensive.yml`)

The primary workflow that runs on:
- Push to `main`, `develop`, `feature/*`, `fix/*` branches
- Pull requests to `main`, `develop`
- Release publications

**Jobs:**
- `security-scan`: Vulnerability and secrets detection
- `test-and-quality`: Code quality and unit tests
- `integration-tests`: Database and service integration tests
- `docker-build`: Container building and registry push
- `performance-tests`: Load and performance testing
- `deploy-staging`: Automatic staging deployment
- `deploy-production`: Production deployment with approvals

### 2. Security Scanning (`.github/workflows/security-scan.yml`)

Dedicated security workflow running:
- Weekly scheduled scans
- On every push and PR

**Security Checks:**
- **Trivy**: Filesystem vulnerability scanning
- **TruffleHog**: Secrets detection
- **Bandit**: Python security analysis
- **Safety**: Dependency vulnerability checking
- **Hadolint**: Dockerfile security best practices
- **License Compliance**: License compatibility checking

### 3. Legacy Workflows

Maintained for compatibility:
- `python-ci.yml`: Basic Python testing
- `pr-checks.yml`: Pull request validation
- `main.yml`: Simplified CI for basic checks

## Testing Strategy

### Unit Tests
```bash
pytest tests/ -v --cov=src --cov-report=xml
```
- **Coverage Requirement**: Minimum 80%
- **Framework**: pytest with asyncio support
- **Mocking**: unittest.mock for external dependencies

### Integration Tests
```bash
pytest tests/ -m integration -v
```
- **Database Testing**: PostgreSQL and Redis connectivity
- **API Testing**: End-to-end workflow validation
- **Service Integration**: External service connections

### Performance Tests
```bash
pytest tests/ -m performance -v
```
- **Load Testing**: Concurrent request handling
- **Benchmarking**: Response time measurement
- **Memory Testing**: Resource usage monitoring
- **Locust Integration**: Scalable load testing

## Security Implementation

### Vulnerability Scanning
- **File System Scan**: Trivy scans all files for known vulnerabilities
- **Dependency Scan**: Safety checks Python packages against vulnerability databases
- **Container Scan**: Docker images scanned before deployment

### Code Security
- **Bandit**: Static analysis for common security issues
- **Secret Detection**: TruffleHog prevents credential leaks
- **License Compliance**: Automated license compatibility checking

### Security Reports
All security findings are:
- Uploaded to GitHub Security tab as SARIF files
- Available as downloadable artifacts
- Integrated with GitHub's security alerts

## Deployment Automation

### Environments

1. **Development** (`develop` branch)
   - Local Docker Compose deployment
   - Full service stack
   - No security restrictions

2. **Staging** (`develop` branch)
   - Production-like environment
   - Database migrations
   - Health checks required

3. **Production** (`main` branch)
   - Manual approval required
   - Performance tests mandatory
   - Automatic rollback on failure

### Deployment Script

Use the automated deployment script:

```bash
# Deploy to development
python scripts/deploy.py development

# Deploy to staging
python scripts/deploy.py staging

# Deploy to production (requires environment approval)
python scripts/deploy.py production

# Rollback if needed
python scripts/deploy.py production --rollback
```

### Pre-deployment Checks
- Docker availability
- Environment variables validation
- Database connectivity
- Test suite execution

## Docker Integration

### Image Building
- **Multi-stage builds**: Development and production targets
- **Security scanning**: Trivy container analysis
- **Registry push**: GitHub Container Registry (ghcr.io)
- **Caching**: GitHub Actions cache for faster builds

### Container Security
- Non-root user execution
- Health check implementation
- Minimal base images
- Security best practices

## Environment Configuration

### Required Secrets
Configure these in GitHub repository secrets:

**Development/Staging:**
- `DATABASE_URL`
- `REDIS_URL`

**Production:**
- `DATABASE_URL`
- `REDIS_URL`
- `CLAUDE_API_KEY`
- `OPENAI_API_KEY`
- `CODECOV_TOKEN` (optional)

### Environment Variables
Set in GitHub repository settings or workflow files:
- `PYTHON_VERSION`: Python version (default: 3.11)
- `REGISTRY`: Container registry (default: ghcr.io)
- `IMAGE_NAME`: Container image name

## Quality Gates

### Code Quality Requirements
- ✅ Linting (Ruff) must pass
- ✅ Type checking (MyPy) must pass
- ✅ Code formatting (Ruff format) must be consistent
- ✅ Test coverage ≥ 80%
- ✅ Security scans must pass
- ✅ No high-severity vulnerabilities

### Performance Requirements
- ✅ Health endpoint response < 1 second
- ✅ Concurrent request handling (>5 RPS)
- ✅ Memory usage stability
- ✅ Load test success rate > 99%

## Monitoring and Alerts

### Health Checks
- Application: `/health` endpoint
- Database: Connection validation
- Services: Dependency health checks

### Performance Monitoring
- Response time tracking
- Memory usage monitoring
- Error rate measurement
- Load test reporting

### Failure Handling
- Automatic rollback on deployment failure
- Slack/email notifications (configurable)
- Detailed failure reporting
- Recovery procedures documented

## Usage Examples

### Running Tests Locally
```bash
# Install development dependencies
pip install -r requirements-dev.txt

# Run unit tests
pytest tests/ -v

# Run integration tests
pytest tests/ -m integration -v

# Run performance tests
pytest tests/ -m performance -v

# Run security scan
bandit -r src/
safety check --file requirements-minimal.txt
```

### Security Scanning
```bash
# Dependency vulnerabilities
safety check --file requirements-minimal.txt

# Code security issues
bandit -r src/

# Container security
docker run --rm -v $(pwd):/app aquasec/trivy fs /app

# Secrets detection
trufflehog filesystem .
```

### Performance Testing
```bash
# Install Locust
pip install locust

# Run load tests
locust -f tests/test_performance.py --host=http://localhost:8000

# Benchmark tests
pytest tests/test_performance.py::TestAPIPerformance -v
```

## Troubleshooting

### Common Issues

1. **Test Failures**
   - Check database connectivity
   - Verify environment variables
   - Review test logs in GitHub Actions

2. **Security Scan Failures**
   - Update vulnerable dependencies
   - Review and fix security issues
   - Update base Docker images

3. **Deployment Failures**
   - Check Docker daemon status
   - Verify environment configuration
   - Review deployment logs

4. **Performance Test Failures**
   - Check system resources
   - Review performance baselines
   - Analyze application logs

### Getting Help

- Review GitHub Actions logs
- Check application health endpoints
- Consult deployment script output
- Review security scan reports

## Continuous Improvement

The CI/CD pipeline is continuously improved with:
- Regular security updates
- Performance optimization
- Tool upgrades
- Process refinements
- Monitoring enhancements

For suggestions or issues, please create a GitHub issue with the `ci-cd` label. 