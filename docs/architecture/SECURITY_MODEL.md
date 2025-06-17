# Security Model - Energia Legal AI Python Backend

## 🛡️ Security Architecture Overview

The Energia Legal AI system implements a comprehensive security model designed specifically for legal document processing, ensuring data confidentiality, integrity, and availability while meeting Hungarian and EU legal compliance requirements.

## 🔐 Authentication & Authorization

### 1. **Authentication Layer**

#### **Supabase Authentication Integration**
```python
from supabase import create_client, Client
import jwt
from typing import Optional

class AuthenticationService:
    def __init__(self):
        self.supabase: Client = create_client(
            SUPABASE_URL, 
            SUPABASE_ANON_KEY
        )
    
    async def verify_token(self, token: str) -> Optional[User]:
        try:
            # Verify JWT token with Supabase
            user = await self.supabase.auth.get_user(token)
            return User.from_supabase_user(user)
        except Exception as e:
            logger.warning(f"Token verification failed: {e}")
            return None
    
    async def authenticate_api_key(self, api_key: str) -> Optional[ServiceAccount]:
        # API key authentication for service-to-service calls
        return await self.verify_api_key(api_key)
```

#### **Multi-Factor Authentication (Planned)**
```python
class MFAService:
    async def generate_totp_secret(self, user_id: str) -> str:
        # Generate TOTP secret for authenticator apps
        pass
    
    async def verify_totp(self, user_id: str, token: str) -> bool:
        # Verify TOTP token
        pass
    
    async def send_sms_code(self, user_id: str, phone: str) -> bool:
        # Send SMS verification code
        pass
```

### 2. **Authorization Framework**

#### **Role-Based Access Control (RBAC)**
```python
from enum import Enum
from typing import List, Set

class UserRole(Enum):
    ADMIN = "admin"
    LEGAL_MANAGER = "legal_manager"
    SENIOR_ANALYST = "senior_analyst"
    ANALYST = "analyst"
    VIEWER = "viewer"

class Permission(Enum):
    # Document permissions
    DOCUMENT_VIEW = "document:view"
    DOCUMENT_UPLOAD = "document:upload"
    DOCUMENT_ANALYZE = "document:analyze"
    DOCUMENT_DELETE = "document:delete"
    DOCUMENT_SHARE = "document:share"
    
    # User management permissions
    USER_INVITE = "user:invite"
    USER_MANAGE = "user:manage"
    USER_DELETE = "user:delete"
    
    # System permissions
    SYSTEM_CONFIGURE = "system:configure"
    AUDIT_VIEW = "audit:view"
    ANALYTICS_VIEW = "analytics:view"

class RBACService:
    def __init__(self):
        self.role_permissions = {
            UserRole.ADMIN: [
                Permission.DOCUMENT_VIEW, Permission.DOCUMENT_UPLOAD,
                Permission.DOCUMENT_ANALYZE, Permission.DOCUMENT_DELETE,
                Permission.DOCUMENT_SHARE, Permission.USER_INVITE,
                Permission.USER_MANAGE, Permission.USER_DELETE,
                Permission.SYSTEM_CONFIGURE, Permission.AUDIT_VIEW,
                Permission.ANALYTICS_VIEW
            ],
            UserRole.LEGAL_MANAGER: [
                Permission.DOCUMENT_VIEW, Permission.DOCUMENT_UPLOAD,
                Permission.DOCUMENT_ANALYZE, Permission.DOCUMENT_SHARE,
                Permission.USER_INVITE, Permission.ANALYTICS_VIEW
            ],
            UserRole.SENIOR_ANALYST: [
                Permission.DOCUMENT_VIEW, Permission.DOCUMENT_UPLOAD,
                Permission.DOCUMENT_ANALYZE, Permission.DOCUMENT_SHARE
            ],
            UserRole.ANALYST: [
                Permission.DOCUMENT_VIEW, Permission.DOCUMENT_UPLOAD,
                Permission.DOCUMENT_ANALYZE
            ],
            UserRole.VIEWER: [
                Permission.DOCUMENT_VIEW
            ]
        }
    
    def check_permission(self, user: User, permission: Permission) -> bool:
        user_permissions = self.role_permissions.get(user.role, [])
        return permission in user_permissions
```

#### **Row-Level Security (RLS) Implementation**
```python
class RLSService:
    """Row-Level Security implementation for Supabase"""
    
    async def create_document_policy(self):
        """Create RLS policy for documents table"""
        policy = """
        CREATE POLICY document_access_policy ON legal_documents
        FOR ALL USING (
            auth.uid() = user_id OR
            EXISTS (
                SELECT 1 FROM document_shares ds
                WHERE ds.document_id = legal_documents.id
                AND ds.shared_with_user_id = auth.uid()
            ) OR
            EXISTS (
                SELECT 1 FROM profiles p
                WHERE p.id = auth.uid()
                AND p.role IN ('admin', 'legal_manager')
            )
        );
        """
        await self.supabase.rpc('execute_sql', {'sql': policy})
    
    async def create_user_data_policy(self):
        """Create RLS policy for user data access"""
        policy = """
        CREATE POLICY user_data_policy ON profiles
        FOR ALL USING (
            auth.uid() = id OR
            EXISTS (
                SELECT 1 FROM profiles p
                WHERE p.id = auth.uid()
                AND p.role IN ('admin', 'legal_manager')
            )
        );
        """
        await self.supabase.rpc('execute_sql', {'sql': policy})
```

## 🔒 Data Protection

### 1. **Encryption at Rest**

#### **Database Encryption**
```python
from cryptography.fernet import Fernet
import os

class EncryptionService:
    def __init__(self):
        self.encryption_key = os.getenv('ENCRYPTION_KEY').encode()
        self.cipher_suite = Fernet(self.encryption_key)
    
    def encrypt_sensitive_data(self, data: str) -> str:
        """Encrypt sensitive data before database storage"""
        encrypted_data = self.cipher_suite.encrypt(data.encode())
        return encrypted_data.decode()
    
    def decrypt_sensitive_data(self, encrypted_data: str) -> str:
        """Decrypt sensitive data after database retrieval"""
        decrypted_data = self.cipher_suite.decrypt(encrypted_data.encode())
        return decrypted_data.decode()

# Usage in data models
class LegalDocument:
    def __init__(self, content: str, is_sensitive: bool = False):
        self.content = content
        if is_sensitive:
            self.encrypted_content = encryption_service.encrypt_sensitive_data(content)
        else:
            self.encrypted_content = None
```

#### **File Storage Encryption**
```python
class SecureFileStorage:
    def __init__(self):
        self.supabase_storage = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY).storage
    
    async def upload_encrypted_file(self, file_content: bytes, file_path: str) -> str:
        # Encrypt file before upload
        encrypted_content = self.encrypt_file(file_content)
        
        # Upload to Supabase Storage with encryption
        result = await self.supabase_storage.from_('legal-documents').upload(
            file_path, 
            encrypted_content,
            file_options={'content-type': 'application/octet-stream'}
        )
        return result['Key']
    
    def encrypt_file(self, content: bytes) -> bytes:
        cipher_suite = Fernet(self.encryption_key)
        return cipher_suite.encrypt(content)
```

### 2. **Encryption in Transit**

#### **TLS/SSL Configuration**
```python
import ssl
from fastapi import FastAPI
import uvicorn

# FastAPI security configuration
app = FastAPI(
    title="Energia Legal AI API",
    description="Secure Legal AI API",
    version="1.0.0",
    docs_url="/docs",  # Only available in development
    redoc_url="/redoc"  # Only available in development
)

# TLS configuration for production
ssl_context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
ssl_context.load_cert_chain('/path/to/cert.pem', '/path/to/key.pem')

if __name__ == "__main__":
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=443,
        ssl_context=ssl_context,
        ssl_keyfile="/path/to/key.pem",
        ssl_certfile="/path/to/cert.pem"
    )
```

#### **API Communication Security**
```python
import httpx
import asyncio

class SecureAPIClient:
    def __init__(self):
        self.session = httpx.AsyncClient(
            verify=True,  # Verify SSL certificates
            timeout=30.0,
            headers={
                'User-Agent': 'Energia-Legal-AI/1.0',
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        )
    
    async def secure_api_call(self, url: str, data: dict, api_key: str) -> dict:
        headers = {
            'Authorization': f'Bearer {api_key}',
            'X-Request-ID': self.generate_request_id()
        }
        
        async with self.session as client:
            response = await client.post(
                url, 
                json=data, 
                headers=headers,
                timeout=60.0
            )
            response.raise_for_status()
            return response.json()
```

## 🔍 Input Validation & Sanitization

### 1. **Request Validation**
```python
from pydantic import BaseModel, validator, Field
from typing import Optional, List
import re

class DocumentUploadRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    content: str = Field(..., min_length=1, max_length=1000000)  # 1MB limit
    document_type: str = Field(..., regex=r'^(contract|legal_opinion|regulation)$')
    is_confidential: bool = False
    
    @validator('title')
    def validate_title(cls, v):
        # Remove potentially harmful characters
        sanitized = re.sub(r'[<>"\'\&]', '', v)
        if not sanitized.strip():
            raise ValueError('Title cannot be empty after sanitization')
        return sanitized.strip()
    
    @validator('content')
    def validate_content(cls, v):
        # Check for potential script injections
        dangerous_patterns = [
            r'<script.*?>.*?</script>',
            r'javascript:',
            r'on\w+\s*=',
            r'data:text/html'
        ]
        
        for pattern in dangerous_patterns:
            if re.search(pattern, v, re.IGNORECASE):
                raise ValueError('Content contains potentially dangerous elements')
        
        return v

class SecurityValidator:
    @staticmethod
    def sanitize_sql_input(input_string: str) -> str:
        """Sanitize input to prevent SQL injection"""
        # Remove common SQL injection patterns
        dangerous_patterns = [
            r'(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)',
            r'(\b(OR|AND)\s+\d+\s*=\s*\d+)',
            r'[\'";]',
            r'--',
            r'/\*.*?\*/'
        ]
        
        sanitized = input_string
        for pattern in dangerous_patterns:
            sanitized = re.sub(pattern, '', sanitized, flags=re.IGNORECASE)
        
        return sanitized.strip()
```

### 2. **File Upload Security**
```python
import magic
from pathlib import Path

class FileSecurityService:
    ALLOWED_EXTENSIONS = {'.pdf', '.doc', '.docx', '.txt'}
    MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
    
    def validate_file(self, file_content: bytes, filename: str) -> bool:
        # Check file size
        if len(file_content) > self.MAX_FILE_SIZE:
            raise ValueError(f"File size exceeds {self.MAX_FILE_SIZE} bytes")
        
        # Check file extension
        file_ext = Path(filename).suffix.lower()
        if file_ext not in self.ALLOWED_EXTENSIONS:
            raise ValueError(f"File extension {file_ext} not allowed")
        
        # Check MIME type
        mime_type = magic.from_buffer(file_content, mime=True)
        allowed_mimes = {
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain'
        }
        
        if mime_type not in allowed_mimes:
            raise ValueError(f"MIME type {mime_type} not allowed")
        
        # Scan for malware (integration with external service)
        if self.contains_malware(file_content):
            raise ValueError("File contains malware")
        
        return True
    
    def contains_malware(self, file_content: bytes) -> bool:
        # Integration with malware scanning service
        # This would typically call an external antivirus API
        return False
```

## 🚨 Rate Limiting & DDoS Protection

### 1. **API Rate Limiting**
```python
from fastapi import Request, HTTPException
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import redis.asyncio as redis

# Redis-based rate limiter
limiter = Limiter(
    key_func=get_remote_address,
    storage_uri="redis://localhost:6379"
)

class CustomRateLimiter:
    def __init__(self):
        self.redis_client = redis.from_url("redis://localhost:6379")
    
    async def check_rate_limit(self, user_id: str, endpoint: str) -> bool:
        key = f"rate_limit:{user_id}:{endpoint}"
        
        # Different limits based on user role
        user = await self.get_user(user_id)
        if user.role == UserRole.ADMIN:
            limit = 1000  # 1000 requests per hour
        elif user.role == UserRole.LEGAL_MANAGER:
            limit = 500   # 500 requests per hour
        else:
            limit = 100   # 100 requests per hour
        
        current_count = await self.redis_client.get(key)
        if current_count and int(current_count) >= limit:
            return False
        
        # Increment counter
        pipe = self.redis_client.pipeline()
        pipe.incr(key)
        pipe.expire(key, 3600)  # 1 hour expiry
        await pipe.execute()
        
        return True

# FastAPI middleware
@app.middleware("http")
async def rate_limiting_middleware(request: Request, call_next):
    user_id = request.state.user.id if hasattr(request.state, 'user') else None
    endpoint = request.url.path
    
    if user_id and not await rate_limiter.check_rate_limit(user_id, endpoint):
        raise HTTPException(
            status_code=429,
            detail="Rate limit exceeded. Please try again later."
        )
    
    response = await call_next(request)
    return response
```

### 2. **DDoS Protection**
```python
class DDoSProtection:
    def __init__(self):
        self.redis_client = redis.from_url("redis://localhost:6379")
        self.suspicious_threshold = 100  # requests per minute
        self.ban_duration = 3600  # 1 hour
    
    async def check_suspicious_activity(self, ip_address: str) -> bool:
        key = f"ddos_protection:{ip_address}"
        
        # Count requests in the last minute
        count = await self.redis_client.get(key)
        if count and int(count) > self.suspicious_threshold:
            # Ban the IP
            await self.ban_ip(ip_address)
            return True
        
        # Increment counter
        pipe = self.redis_client.pipeline()
        pipe.incr(key)
        pipe.expire(key, 60)  # 1 minute window
        await pipe.execute()
        
        return False
    
    async def ban_ip(self, ip_address: str):
        ban_key = f"banned_ip:{ip_address}"
        await self.redis_client.setex(ban_key, self.ban_duration, "1")
        
        # Log the ban
        logger.warning(f"IP {ip_address} banned for suspicious activity")
    
    async def is_banned(self, ip_address: str) -> bool:
        ban_key = f"banned_ip:{ip_address}"
        return await self.redis_client.exists(ban_key)
```

## 📊 Audit Logging & Monitoring

### 1. **Comprehensive Audit Trail**
```python
from datetime import datetime
from typing import Any, Dict
import json

class AuditLogger:
    def __init__(self):
        self.supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    
    async def log_user_action(
        self,
        user_id: str,
        action: str,
        resource_type: str,
        resource_id: str,
        details: Dict[str, Any] = None,
        ip_address: str = None,
        user_agent: str = None
    ):
        audit_entry = {
            'user_id': user_id,
            'action': action,
            'resource_type': resource_type,
            'resource_id': resource_id,
            'details': json.dumps(details) if details else None,
            'ip_address': ip_address,
            'user_agent': user_agent,
            'timestamp': datetime.utcnow().isoformat(),
            'success': True
        }
        
        await self.supabase.table('audit_logs').insert(audit_entry).execute()
    
    async def log_security_event(
        self,
        event_type: str,
        severity: str,
        description: str,
        user_id: str = None,
        metadata: Dict[str, Any] = None
    ):
        security_event = {
            'event_type': event_type,
            'severity': severity,
            'description': description,
            'user_id': user_id,
            'metadata': json.dumps(metadata) if metadata else None,
            'timestamp': datetime.utcnow().isoformat()
        }
        
        await self.supabase.table('security_events').insert(security_event).execute()
        
        # Alert on high severity events
        if severity in ['HIGH', 'CRITICAL']:
            await self.send_security_alert(security_event)

# Usage in endpoints
@app.post("/api/v1/documents/{document_id}/analyze")
async def analyze_document(
    document_id: str,
    request: Request,
    current_user: User = Depends(get_current_user)
):
    try:
        # Perform analysis
        result = await document_service.analyze(document_id, current_user.id)
        
        # Log successful action
        await audit_logger.log_user_action(
            user_id=current_user.id,
            action="DOCUMENT_ANALYZE",
            resource_type="DOCUMENT",
            resource_id=document_id,
            ip_address=request.client.host,
            user_agent=request.headers.get("user-agent")
        )
        
        return result
        
    except Exception as e:
        # Log failed action
        await audit_logger.log_user_action(
            user_id=current_user.id,
            action="DOCUMENT_ANALYZE_FAILED",
            resource_type="DOCUMENT",
            resource_id=document_id,
            details={"error": str(e)},
            ip_address=request.client.host,
            user_agent=request.headers.get("user-agent")
        )
        raise
```

### 2. **Security Monitoring**
```python
class SecurityMonitor:
    def __init__(self):
        self.alert_thresholds = {
            'failed_logins': 5,
            'permission_denials': 10,
            'unusual_access_patterns': 20
        }
    
    async def monitor_failed_logins(self, user_id: str = None, ip_address: str = None):
        # Monitor failed login attempts
        if user_id:
            key = f"failed_logins:user:{user_id}"
        else:
            key = f"failed_logins:ip:{ip_address}"
        
        count = await self.redis_client.incr(key)
        await self.redis_client.expire(key, 3600)  # 1 hour window
        
        if count >= self.alert_thresholds['failed_logins']:
            await self.send_security_alert({
                'type': 'FAILED_LOGIN_THRESHOLD',
                'user_id': user_id,
                'ip_address': ip_address,
                'count': count
            })
    
    async def monitor_permission_denials(self, user_id: str):
        key = f"permission_denials:{user_id}"
        count = await self.redis_client.incr(key)
        await self.redis_client.expire(key, 3600)
        
        if count >= self.alert_thresholds['permission_denials']:
            await self.send_security_alert({
                'type': 'PERMISSION_DENIAL_THRESHOLD',
                'user_id': user_id,
                'count': count
            })
```

## 🔒 API Key Management

### 1. **Service-to-Service Authentication**
```python
class APIKeyManager:
    def __init__(self):
        self.supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    
    async def generate_api_key(self, service_name: str, permissions: List[str]) -> str:
        # Generate secure API key
        api_key = self.generate_secure_key()
        
        # Store in database with permissions
        await self.supabase.table('api_keys').insert({
            'key_hash': self.hash_key(api_key),
            'service_name': service_name,
            'permissions': permissions,
            'created_at': datetime.utcnow().isoformat(),
            'is_active': True
        }).execute()
        
        return api_key
    
    async def validate_api_key(self, api_key: str) -> Dict[str, Any]:
        key_hash = self.hash_key(api_key)
        
        result = await self.supabase.table('api_keys').select('*').eq(
            'key_hash', key_hash
        ).eq('is_active', True).execute()
        
        if not result.data:
            raise ValueError("Invalid API key")
        
        key_data = result.data[0]
        
        # Update last used timestamp
        await self.supabase.table('api_keys').update({
            'last_used_at': datetime.utcnow().isoformat()
        }).eq('id', key_data['id']).execute()
        
        return key_data
    
    def generate_secure_key(self) -> str:
        import secrets
        return f"sk-{secrets.token_urlsafe(32)}"
    
    def hash_key(self, api_key: str) -> str:
        import hashlib
        return hashlib.sha256(api_key.encode()).hexdigest()
```

## 🎯 Compliance & Legal Requirements

### 1. **GDPR Compliance**
```python
class GDPRComplianceService:
    async def handle_data_deletion_request(self, user_id: str):
        """Handle user's right to be forgotten"""
        # 1. Anonymize user data
        await self.anonymize_user_data(user_id)
        
        # 2. Delete personal information
        await self.delete_personal_data(user_id)
        
        # 3. Log the deletion
        await audit_logger.log_user_action(
            user_id=user_id,
            action="GDPR_DATA_DELETION",
            resource_type="USER_DATA",
            resource_id=user_id
        )
    
    async def export_user_data(self, user_id: str) -> Dict[str, Any]:
        """Export all user data for data portability"""
        user_data = {}
        
        # Collect data from all relevant tables
        tables = ['profiles', 'legal_documents', 'analyses', 'audit_logs']
        
        for table in tables:
            data = await self.supabase.table(table).select('*').eq(
                'user_id', user_id
            ).execute()
            user_data[table] = data.data
        
        return user_data
```

### 2. **Legal Document Confidentiality**
```python
class ConfidentialityService:
    async def mark_document_confidential(self, document_id: str, user_id: str):
        # Update document confidentiality status
        await self.supabase.table('legal_documents').update({
            'is_confidential': True,
            'confidentiality_level': 'HIGH',
            'updated_at': datetime.utcnow().isoformat()
        }).eq('id', document_id).execute()
        
        # Create access restriction
        await self.create_access_restriction(document_id, user_id)
    
    async def check_document_access(self, document_id: str, user_id: str) -> bool:
        # Check if user has access to confidential document
        access_check = await self.supabase.rpc('check_document_access', {
            'doc_id': document_id,
            'requesting_user_id': user_id
        }).execute()
        
        return access_check.data
```

---

This comprehensive security model ensures that the Energia Legal AI Python backend maintains the highest standards of security, privacy, and compliance required for legal document processing and analysis.
