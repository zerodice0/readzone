# HSM Integration Deployment Guide

**버전**: v1.0  
**대상**: DevOps Engineers, System Administrators  
**환경**: Production, Staging, Development

---

## 📋 배포 전 체크리스트

### 필수 사항
- [ ] AWS/Azure/GCP 계정 및 권한 설정
- [ ] HSM 서비스 활성화 (KMS/Key Vault/Cloud KMS)
- [ ] IAM 역할 및 정책 구성
- [ ] 네트워크 연결 및 보안 그룹 설정
- [ ] 모니터링 및 로깅 인프라 준비

### 환경별 설정
- [ ] **Production**: Multi-region, HA 설정
- [ ] **Staging**: Production과 동일한 구성
- [ ] **Development**: 단일 리전, 기본 설정

---

## 🚀 AWS KMS 배포

### 1. IAM 역할 생성

```bash
# ReadZone Service Role 생성
aws iam create-role \
  --role-name ReadZone-KMS-Service-Role \
  --assume-role-policy-document file://trust-policy.json

# 정책 연결
aws iam attach-role-policy \
  --role-name ReadZone-KMS-Service-Role \
  --policy-arn arn:aws:iam::aws:policy/AWSKeyManagementServicePowerUser
```

**trust-policy.json**:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": ["ec2.amazonaws.com", "ecs-tasks.amazonaws.com"]
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
```

### 2. KMS 키 생성

```bash
# Master Key 생성
aws kms create-key \
  --description "ReadZone Master Encryption Key" \
  --key-usage ENCRYPT_DECRYPT \
  --origin AWS_KMS \
  --multi-region \
  --tags TagKey=Application,TagValue=ReadZone \
         TagKey=Environment,TagValue=production

# Alias 생성
aws kms create-alias \
  --alias-name alias/readzone-master-key \
  --target-key-id <KEY-ID>
```

### 3. 환경 변수 설정

```bash
# Production 환경 변수
export AWS_REGION=us-east-1
export AWS_ACCOUNT_ID=123456789012
export READZONE_SERVICE_ROLE_ARN=arn:aws:iam::123456789012:role/ReadZone-KMS-Service-Role
export READZONE_MASTER_KEY_ID=alias/readzone-master-key
```

### 4. 애플리케이션 구성

**config/production.yml**:
```yaml
encryption:
  hsm:
    provider: AWS_KMS
    connection:
      region: us-east-1
    credentials:
      type: IAM_ROLE
      data:
        roleArn: ${READZONE_SERVICE_ROLE_ARN}
    performance:
      connectionPoolSize: 20
      requestTimeout: 5000
      retryPolicy:
        maxRetries: 3
        backoffMultiplier: 2
    highAvailability:
      replicas:
        - region: us-west-2
          roleArn: ${READZONE_SERVICE_ROLE_ARN}
      loadBalancing: FAILOVER
    monitoring:
      cloudwatch:
        enabled: true
        namespace: ReadZone/HSM
      alerts:
        - metric: ErrorRate
          threshold: 0.01
          action: sns:arn:aws:sns:us-east-1:123456789012:readzone-alerts
```

---

## 🔧 Azure Key Vault 배포

### 1. Azure 리소스 생성

```bash
# 리소스 그룹 생성
az group create \
  --name readzone-security \
  --location eastus

# Key Vault 생성
az keyvault create \
  --name readzone-production-kv \
  --resource-group readzone-security \
  --location eastus \
  --sku premium \
  --enable-soft-delete true \
  --enable-purge-protection true

# Managed HSM 생성 (Enterprise용)
az keyvault create-hsm \
  --name readzone-prod-hsm \
  --resource-group readzone-security \
  --location eastus \
  --administrators $(az ad signed-in-user show --query objectId -o tsv)
```

### 2. 서비스 주체 생성

```bash
# 서비스 주체 생성
az ad sp create-for-rbac \
  --name readzone-keyvault-sp \
  --role "Key Vault Crypto Officer" \
  --scopes /subscriptions/<SUBSCRIPTION-ID>/resourceGroups/readzone-security

# Key Vault 액세스 정책 설정
az keyvault set-policy \
  --name readzone-production-kv \
  --spn <SERVICE-PRINCIPAL-ID> \
  --key-permissions encrypt decrypt wrapKey unwrapKey create import list get
```

### 3. 애플리케이션 구성

**config/azure-production.yml**:
```yaml
encryption:
  hsm:
    provider: AZURE_KEY_VAULT
    connection:
      endpoint: readzone-production-kv
      region: eastus
    credentials:
      type: SERVICE_PRINCIPAL
      data:
        tenantId: ${AZURE_TENANT_ID}
        clientId: ${AZURE_CLIENT_ID}
        clientSecret: ${AZURE_CLIENT_SECRET}
    performance:
      connectionPoolSize: 15
      requestTimeout: 6000
    monitoring:
      insights:
        enabled: true
        instrumentationKey: ${AZURE_INSIGHTS_KEY}
```

---

## 🔐 Google Cloud KMS 배포

### 1. GCP 프로젝트 설정

```bash
# 프로젝트 설정
gcloud config set project readzone-production

# KMS API 활성화
gcloud services enable cloudkms.googleapis.com

# Key Ring 생성
gcloud kms keyrings create readzone-keys \
  --location=global

# 암호화 키 생성
gcloud kms keys create readzone-master-key \
  --location=global \
  --keyring=readzone-keys \
  --purpose=encryption
```

### 2. 서비스 계정 생성

```bash
# 서비스 계정 생성
gcloud iam service-accounts create readzone-kms-service \
  --display-name="ReadZone KMS Service Account"

# 권한 부여
gcloud projects add-iam-policy-binding readzone-production \
  --member="serviceAccount:readzone-kms-service@readzone-production.iam.gserviceaccount.com" \
  --role="roles/cloudkms.cryptoKeyEncrypterDecrypter"

# 키 파일 생성
gcloud iam service-accounts keys create readzone-kms-key.json \
  --iam-account=readzone-kms-service@readzone-production.iam.gserviceaccount.com
```

### 3. 애플리케이션 구성

**config/gcp-production.yml**:
```yaml
encryption:
  hsm:
    provider: GCP_KMS
    connection:
      region: global
      projectId: readzone-production
    credentials:
      type: SERVICE_ACCOUNT
      data:
        keyFilePath: /secrets/readzone-kms-key.json
    performance:
      connectionPoolSize: 12
      requestTimeout: 7000
```

---

## 🔄 High Availability 설정

### Multi-Region AWS 설정

```yaml
encryption:
  hsm:
    provider: AWS_KMS
    highAvailability:
      primary:
        provider: AWS_KMS
        connection:
          region: us-east-1
      secondary:
        west:
          provider: AWS_KMS
          connection:
            region: us-west-2
        eu:
          provider: AWS_KMS
          connection:
            region: eu-west-1
      loadBalancing: WEIGHTED
      healthCheck:
        interval: 30000
        timeout: 5000
        unhealthyThreshold: 3
        healthyThreshold: 2
      failover:
        automatic: true
        maxRetries: 3
        retryDelay: 1000
```

### Cross-Cloud Backup 설정

```yaml
encryption:
  hsm:
    primary:
      provider: AWS_KMS
    backup:
      azure:
        provider: AZURE_KEY_VAULT
        syncInterval: 86400  # 24 hours
      gcp:
        provider: GCP_KMS
        syncInterval: 86400
```

---

## 📊 모니터링 설정

### CloudWatch (AWS)

```yaml
monitoring:
  cloudwatch:
    enabled: true
    namespace: ReadZone/HSM
    metrics:
      - name: OperationLatency
        unit: Milliseconds
      - name: ErrorRate
        unit: Percent
      - name: ThroughputOPS
        unit: Count/Second
    alarms:
      - name: HSM-High-Error-Rate
        metric: ErrorRate
        threshold: 1.0
        comparison: GreaterThanThreshold
        periods: 2
        evaluation: 5
        actions:
          - sns:arn:aws:sns:us-east-1:123456789012:readzone-alerts
```

### Azure Monitor

```yaml
monitoring:
  azure:
    enabled: true
    workspace: readzone-analytics
    metrics:
      - category: Audit
        enabled: true
      - category: AllMetrics
        enabled: true
    alerts:
      - name: Key-Vault-High-Latency
        metric: ServiceApiLatency
        threshold: 1000
        severity: 2
```

### Google Cloud Monitoring

```yaml
monitoring:
  gcp:
    enabled: true
    project: readzone-production
    alerts:
      - displayName: KMS API Errors
        conditions:
          - displayName: Error rate too high
            conditionThreshold:
              filter: resource.type="kms_key"
              comparison: COMPARISON_GT
              thresholdValue: 0.01
```

---

## 🧪 테스트 및 검증

### 1. 연결 테스트

```bash
# AWS KMS 테스트
npm run test:hsm:aws

# Azure Key Vault 테스트
npm run test:hsm:azure

# GCP KMS 테스트
npm run test:hsm:gcp
```

### 2. 성능 테스트

```bash
# 부하 테스트
npm run benchmark:hsm -- --provider=AWS_KMS --operations=1000 --concurrency=10

# 지연 시간 테스트
npm run latency:hsm -- --provider=AWS_KMS --duration=300
```

### 3. 장애 복구 테스트

```bash
# Failover 테스트
npm run test:hsm:failover

# 재해 복구 테스트
npm run test:hsm:disaster-recovery
```

---

## 🚨 문제 해결

### 일반적인 문제

1. **권한 오류**
   ```
   AccessDenied: User is not authorized to perform: kms:Decrypt
   ```
   - IAM 정책 확인
   - 서비스 역할 연결 확인

2. **연결 시간 초과**
   ```
   TimeoutError: Request timed out after 5000ms
   ```
   - 네트워크 연결 확인
   - 보안 그룹/방화벽 설정 확인

3. **키 없음 오류**
   ```
   NotFoundException: Key 'alias/readzone-master' does not exist
   ```
   - 키 생성 확인
   - Alias 설정 확인

### 로그 분석

```bash
# AWS CloudWatch 로그 확인
aws logs filter-log-events \
  --log-group-name /aws/lambda/readzone-hsm \
  --start-time $(date -d '1 hour ago' +%s)000

# Azure 로그 분석
az monitor log-analytics query \
  --workspace readzone-analytics \
  --analytics-query "KeyVaultData | where TimeGenerated > ago(1h)"

# GCP 로그 뷰어
gcloud logging read "resource.type=kms_key AND timestamp>=2025-02-01T00:00:00Z"
```

---

## 📋 체크리스트

### 배포 후 검증
- [ ] HSM 연결 테스트 통과
- [ ] 키 생성/랩핑/언랩핑 동작 확인
- [ ] High Availability 설정 테스트
- [ ] 모니터링 대시보드 설정
- [ ] 알림 테스트 수행
- [ ] 장애 복구 절차 문서화
- [ ] 팀 교육 완료

### 보안 검토
- [ ] 최소 권한 원칙 적용
- [ ] 키 액세스 로그 활성화
- [ ] 네트워크 보안 그룹 제한
- [ ] 암호화 키 백업 설정
- [ ] 정기 보안 감사 일정 수립

---

**배포 승인**: DevOps Team Lead  
**보안 검토**: Security Team Lead  
**운영 준비**: SRE Team Lead