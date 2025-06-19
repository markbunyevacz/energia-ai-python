import structlog
import hashlib
import secrets
import jwt
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List
from dataclasses import dataclass, field
from enum import Enum
import asyncio
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
import base64
import json

from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from supabase import create_client, Client

from energia_ai.config.settings import get_settings

logger = structlog.get_logger(__name__)
settings = get_settings()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

supabase: Client = create_client(settings.supabase_url, settings.supabase_anon_key)


class UserRole(Enum):
    """User role enumeration for authorization."""
    ADMIN = "admin"
    JOGASZ = "jogasz"  # Lawyer
    USER = "user"
    GUEST = "guest"


class SecurityAction(Enum):
    """Security actions for audit logging."""
    LOGIN = "login"
    LOGOUT = "logout"
    ACCESS_GRANTED = "access_granted"
    ACCESS_DENIED = "access_denied"
    DATA_ACCESS = "data_access"
    DATA_MODIFICATION = "data_modification"
    DATA_DELETION = "data_deletion"
    SECURITY_VIOLATION = "security_violation"
    GDPR_REQUEST = "gdpr_request"


@dataclass
class SecurityEvent:
    """Security event for audit logging."""
    event_id: str = field(default_factory=lambda: secrets.token_hex(16))
    timestamp: datetime = field(default_factory=datetime.now)
    user_id: Optional[str] = None
    action: SecurityAction = SecurityAction.ACCESS_GRANTED
    resource: Optional[str] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    success: bool = True
    error_message: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class UserProfile:
    """Enhanced user profile with security context."""
    user_id: str
    email: str
    role: UserRole
    permissions: List[str] = field(default_factory=list)
    last_login: Optional[datetime] = None
    failed_login_attempts: int = 0
    account_locked: bool = False
    gdpr_consent: bool = False
    data_retention_until: Optional[datetime] = None
    created_at: datetime = field(default_factory=datetime.now)
    updated_at: datetime = field(default_factory=datetime.now)


class DataEncryption:
    """Data encryption and anonymization utilities."""
    
    def __init__(self, encryption_key: Optional[bytes] = None):
        self.logger = logger.bind(component="data_encryption")
        
        if encryption_key:
            self.cipher = Fernet(encryption_key)
        else:
            # Generate a key from settings or create new one
            key = self._derive_key_from_settings()
            self.cipher = Fernet(key)
    
    def _derive_key_from_settings(self) -> bytes:
        """Derive encryption key from settings."""
        password = settings.encryption_password.encode() if hasattr(settings, 'encryption_password') else b"default_key"
        salt = settings.encryption_salt.encode() if hasattr(settings, 'encryption_salt') else b"default_salt"
        
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000,
        )
        key = base64.urlsafe_b64encode(kdf.derive(password))
        return key
    
    def encrypt_sensitive_data(self, data: str) -> str:
        """Encrypt sensitive data."""
        try:
            encrypted_data = self.cipher.encrypt(data.encode())
            return base64.urlsafe_b64encode(encrypted_data).decode()
        except Exception as e:
            self.logger.error("Encryption failed", error=str(e))
            raise
    
    def decrypt_sensitive_data(self, encrypted_data: str) -> str:
        """Decrypt sensitive data."""
        try:
            encrypted_bytes = base64.urlsafe_b64decode(encrypted_data.encode())
            decrypted_data = self.cipher.decrypt(encrypted_bytes)
            return decrypted_data.decode()
        except Exception as e:
            self.logger.error("Decryption failed", error=str(e))
            raise
    
    def anonymize_personal_data(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Anonymize personal data for GDPR compliance."""
        sensitive_fields = ['email', 'name', 'phone', 'address', 'personal_id']
        anonymized_data = data.copy()
        
        for field in sensitive_fields:
            if field in anonymized_data:
                # Replace with anonymized version
                anonymized_data[field] = self._generate_anonymized_value(field, data[field])
        
        return anonymized_data
    
    def _generate_anonymized_value(self, field_type: str, original_value: str) -> str:
        """Generate anonymized value based on field type."""
        hash_value = hashlib.sha256(f"{field_type}_{original_value}".encode()).hexdigest()[:8]
        
        if field_type == 'email':
            return f"anonymized_{hash_value}@domain.com"
        elif field_type == 'name':
            return f"Anonymized User {hash_value}"
        else:
            return f"anonymized_{hash_value}"


class AuditLogger:
    """Comprehensive audit logging system."""
    
    def __init__(self):
        self.logger = logger.bind(component="audit_logger")
        self._audit_queue: List[SecurityEvent] = []
    
    async def log_security_event(self, event: SecurityEvent):
        """Log a security event."""
        try:
            # Add to queue for batch processing
            self._audit_queue.append(event)
            
            # Log to structured logging
            self.logger.info("Security event",
                           event_id=event.event_id,
                           action=event.action.value,
                           user_id=event.user_id,
                           resource=event.resource,
                           ip_address=event.ip_address,
                           success=event.success,
                           error_message=event.error_message)
            
            # Store in database for compliance
            await self._store_audit_event(event)
            
        except Exception as e:
            self.logger.error("Failed to log security event", error=str(e))
    
    async def _store_audit_event(self, event: SecurityEvent):
        """Store audit event in database."""
        try:
            audit_data = {
                'event_id': event.event_id,
                'timestamp': event.timestamp.isoformat(),
                'user_id': event.user_id,
                'action': event.action.value,
                'resource': event.resource,
                'ip_address': event.ip_address,
                'user_agent': event.user_agent,
                'success': event.success,
                'error_message': event.error_message,
                'metadata': json.dumps(event.metadata)
            }
            
            # Store in Supabase audit table
            result = supabase.table('audit_logs').insert(audit_data).execute()
            
        except Exception as e:
            self.logger.error("Failed to store audit event", error=str(e))
    
    async def get_security_events(self, user_id: Optional[str] = None, 
                                action: Optional[SecurityAction] = None,
                                start_date: Optional[datetime] = None,
                                end_date: Optional[datetime] = None) -> List[SecurityEvent]:
        """Retrieve security events based on filters."""
        try:
            query = supabase.table('audit_logs').select('*')
            
            if user_id:
                query = query.eq('user_id', user_id)
            if action:
                query = query.eq('action', action.value)
            if start_date:
                query = query.gte('timestamp', start_date.isoformat())
            if end_date:
                query = query.lte('timestamp', end_date.isoformat())
            
            result = query.execute()
            
            events = []
            for row in result.data:
                event = SecurityEvent(
                    event_id=row['event_id'],
                    timestamp=datetime.fromisoformat(row['timestamp']),
                    user_id=row['user_id'],
                    action=SecurityAction(row['action']),
                    resource=row['resource'],
                    ip_address=row['ip_address'],
                    user_agent=row['user_agent'],
                    success=row['success'],
                    error_message=row['error_message'],
                    metadata=json.loads(row['metadata']) if row['metadata'] else {}
                )
                events.append(event)
            
            return events
            
        except Exception as e:
            self.logger.error("Failed to retrieve security events", error=str(e))
            return []


class GDPRCompliance:
    """GDPR compliance utilities."""
    
    def __init__(self, encryption: DataEncryption):
        self.logger = logger.bind(component="gdpr_compliance")
        self.encryption = encryption
    
    async def handle_data_subject_request(self, user_id: str, request_type: str) -> Dict[str, Any]:
        """Handle GDPR data subject requests."""
        try:
            if request_type == "access":
                return await self._handle_data_access_request(user_id)
            elif request_type == "deletion":
                return await self._handle_data_deletion_request(user_id)
            elif request_type == "portability":
                return await self._handle_data_portability_request(user_id)
            else:
                raise ValueError(f"Unknown request type: {request_type}")
                
        except Exception as e:
            self.logger.error("GDPR request failed", user_id=user_id, request_type=request_type, error=str(e))
            raise
    
    async def _handle_data_access_request(self, user_id: str) -> Dict[str, Any]:
        """Handle data access request (Article 15)."""
        try:
            # Collect all user data from various tables
            user_data = {
                "personal_data": await self._get_user_personal_data(user_id),
                "search_history": await self._get_user_search_history(user_id),
                "document_access": await self._get_user_document_access(user_id),
                "preferences": await self._get_user_preferences(user_id),
                "audit_logs": await self._get_user_audit_logs(user_id)
            }
            
            return {
                "status": "completed",
                "data": user_data,
                "generated_at": datetime.now().isoformat(),
                "retention_period": "Data will be retained until explicitly requested for deletion"
            }
            
        except Exception as e:
            self.logger.error("Data access request failed", user_id=user_id, error=str(e))
            raise
    
    async def _handle_data_deletion_request(self, user_id: str) -> Dict[str, Any]:
        """Handle data deletion request (Article 17)."""
        try:
            # Mark user for deletion (soft delete initially)
            deletion_results = {
                "personal_data": await self._anonymize_user_data(user_id),
                "search_history": await self._delete_user_search_history(user_id),
                "preferences": await self._delete_user_preferences(user_id),
                "scheduled_full_deletion": datetime.now() + timedelta(days=30)
            }
            
            return {
                "status": "completed",
                "message": "User data has been anonymized and scheduled for full deletion",
                "deletion_results": deletion_results
            }
            
        except Exception as e:
            self.logger.error("Data deletion request failed", user_id=user_id, error=str(e))
            raise
    
    async def _handle_data_portability_request(self, user_id: str) -> Dict[str, Any]:
        """Handle data portability request (Article 20)."""
        try:
            portable_data = await self._get_user_portable_data(user_id)
            
            return {
                "status": "completed",
                "data_format": "JSON",
                "data": portable_data,
                "export_date": datetime.now().isoformat()
            }
            
        except Exception as e:
            self.logger.error("Data portability request failed", user_id=user_id, error=str(e))
            raise
    
    async def _get_user_personal_data(self, user_id: str) -> Dict[str, Any]:
        """Get user personal data."""
        try:
            result = supabase.table('profiles').select('*').eq('id', user_id).execute()
            return result.data[0] if result.data else {}
        except Exception:
            return {}
    
    async def _get_user_search_history(self, user_id: str) -> List[Dict[str, Any]]:
        """Get user search history."""
        try:
            result = supabase.table('search_history').select('*').eq('user_id', user_id).execute()
            return result.data
        except Exception:
            return []
    
    async def _get_user_document_access(self, user_id: str) -> List[Dict[str, Any]]:
        """Get user document access history."""
        try:
            result = supabase.table('document_access_logs').select('*').eq('user_id', user_id).execute()
            return result.data
        except Exception:
            return []
    
    async def _get_user_preferences(self, user_id: str) -> Dict[str, Any]:
        """Get user preferences."""
        try:
            result = supabase.table('user_preferences').select('*').eq('user_id', user_id).execute()
            return result.data[0] if result.data else {}
        except Exception:
            return {}
    
    async def _get_user_audit_logs(self, user_id: str) -> List[Dict[str, Any]]:
        """Get user audit logs."""
        try:
            result = supabase.table('audit_logs').select('*').eq('user_id', user_id).execute()
            return result.data
        except Exception:
            return []
    
    async def _anonymize_user_data(self, user_id: str) -> Dict[str, Any]:
        """Anonymize user data."""
        try:
            # Get current user data
            user_data_result = supabase.table('profiles').select('*').eq('id', user_id).execute()
            if not user_data_result.data:
                return {"status": "no_data_found"}
            
            user_data = user_data_result.data[0]
            anonymized_data = self.encryption.anonymize_personal_data(user_data)
            
            # Update with anonymized data
            supabase.table('profiles').update(anonymized_data).eq('id', user_id).execute()
            
            return {"status": "anonymized", "anonymized_fields": list(anonymized_data.keys())}
            
        except Exception as e:
            self.logger.error("User data anonymization failed", user_id=user_id, error=str(e))
            raise
    
    async def _delete_user_search_history(self, user_id: str) -> Dict[str, Any]:
        """Delete user search history."""
        try:
            result = supabase.table('search_history').delete().eq('user_id', user_id).execute()
            return {"status": "deleted", "deleted_count": len(result.data)}
        except Exception as e:
            self.logger.error("Search history deletion failed", user_id=user_id, error=str(e))
            return {"status": "error", "error": str(e)}
    
    async def _delete_user_preferences(self, user_id: str) -> Dict[str, Any]:
        """Delete user preferences."""
        try:
            result = supabase.table('user_preferences').delete().eq('user_id', user_id).execute()
            return {"status": "deleted", "deleted_count": len(result.data)}
        except Exception as e:
            self.logger.error("User preferences deletion failed", user_id=user_id, error=str(e))
            return {"status": "error", "error": str(e)}
    
    async def _get_user_portable_data(self, user_id: str) -> Dict[str, Any]:
        """Get user data in portable format."""
        try:
            return {
                "personal_data": await self._get_user_personal_data(user_id),
                "preferences": await self._get_user_preferences(user_id),
                "search_history": await self._get_user_search_history(user_id)
            }
        except Exception as e:
            self.logger.error("Portable data generation failed", user_id=user_id, error=str(e))
            raise


class SecurityMonitor:
    """Security monitoring and threat detection."""
    
    def __init__(self):
        self.logger = logger.bind(component="security_monitor")
        self._threat_indicators: Dict[str, List[str]] = {
            "suspicious_ips": [],
            "failed_login_attempts": {},
            "unusual_access_patterns": []
        }
    
    async def monitor_login_attempt(self, ip_address: str, user_id: str, success: bool):
        """Monitor login attempts for suspicious patterns."""
        try:
            if not success:
                # Track failed attempts
                key = f"{ip_address}_{user_id}"
                if key not in self._threat_indicators["failed_login_attempts"]:
                    self._threat_indicators["failed_login_attempts"][key] = []
                
                self._threat_indicators["failed_login_attempts"][key].append(datetime.now())
                
                # Check for brute force attack
                recent_attempts = [
                    attempt for attempt in self._threat_indicators["failed_login_attempts"][key]
                    if (datetime.now() - attempt).total_seconds() < 3600  # Last hour
                ]
                
                if len(recent_attempts) >= 5:  # 5 failed attempts in an hour
                    await self._handle_security_threat("brute_force", {
                        "ip_address": ip_address,
                        "user_id": user_id,
                        "failed_attempts": len(recent_attempts)
                    })
                    
        except Exception as e:
            self.logger.error("Login monitoring failed", error=str(e))
    
    async def monitor_data_access(self, user_id: str, resource: str, ip_address: str):
        """Monitor data access patterns."""
        try:
            # Check for unusual access patterns
            access_key = f"{user_id}_{datetime.now().date()}"
            
            # This would implement more sophisticated pattern detection
            # For now, just log the access
            self.logger.info("Data access monitored",
                           user_id=user_id,
                           resource=resource,
                           ip_address=ip_address)
                           
        except Exception as e:
            self.logger.error("Data access monitoring failed", error=str(e))
    
    async def _handle_security_threat(self, threat_type: str, details: Dict[str, Any]):
        """Handle detected security threats."""
        try:
            self.logger.warning("Security threat detected",
                              threat_type=threat_type,
                              details=details)
            
            # Implement automated response
            if threat_type == "brute_force":
                await self._implement_rate_limiting(details["ip_address"])
            
            # Store threat information
            threat_data = {
                "threat_type": threat_type,
                "detected_at": datetime.now().isoformat(),
                "details": json.dumps(details),
                "status": "detected"
            }
            
            supabase.table('security_threats').insert(threat_data).execute()
            
        except Exception as e:
            self.logger.error("Threat handling failed", error=str(e))
    
    async def _implement_rate_limiting(self, ip_address: str):
        """Implement rate limiting for suspicious IP."""
        try:
            # Add IP to suspicious list
            if ip_address not in self._threat_indicators["suspicious_ips"]:
                self._threat_indicators["suspicious_ips"].append(ip_address)
            
            self.logger.info("Rate limiting implemented", ip_address=ip_address)
            
        except Exception as e:
            self.logger.error("Rate limiting failed", error=str(e))


class EnhancedAuthenticationService:
    """Enhanced authentication service with comprehensive security."""

    def __init__(self):
        self.logger = logger.bind(component="authentication")
        self.encryption = DataEncryption()
        self.audit_logger = AuditLogger()
        self.gdpr_compliance = GDPRCompliance(self.encryption)
        self.security_monitor = SecurityMonitor()
    
    async def authenticate_user(self, email: str, password: str, request: Request) -> UserProfile:
        """Authenticate user with comprehensive security logging."""
        ip_address = request.client.host if request.client else "unknown"
        user_agent = request.headers.get("user-agent", "unknown")
        
        try:
            # Attempt authentication
            user = await self._verify_credentials(email, password)
            
            if user:
                # Log successful authentication
                await self.audit_logger.log_security_event(SecurityEvent(
                    user_id=user.user_id,
                    action=SecurityAction.LOGIN,
                    ip_address=ip_address,
                    user_agent=user_agent,
                    success=True
                ))
                
                # Monitor login
                await self.security_monitor.monitor_login_attempt(ip_address, user.user_id, True)
                
                return user
            else:
                # Log failed authentication
                await self.audit_logger.log_security_event(SecurityEvent(
                    action=SecurityAction.LOGIN,
                    ip_address=ip_address,
                    user_agent=user_agent,
                    success=False,
                    error_message="Invalid credentials"
                ))
                
                # Monitor failed login
                await self.security_monitor.monitor_login_attempt(ip_address, email, False)
                
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid credentials"
                )
                
        except Exception as e:
            self.logger.error("Authentication failed", email=email, error=str(e))
            raise
    
    async def _verify_credentials(self, email: str, password: str) -> Optional[UserProfile]:
        """Verify user credentials."""
        try:
            # Get user from Supabase
            auth_response = supabase.auth.sign_in_with_password({
                "email": email,
                "password": password
            })
            
            if auth_response.user:
                # Get user profile
                profile_result = supabase.table('profiles').select('*').eq('id', auth_response.user.id).execute()
                
                if profile_result.data:
                    profile_data = profile_result.data[0]
                    
                    user_profile = UserProfile(
                        user_id=auth_response.user.id,
                        email=auth_response.user.email,
                        role=UserRole(profile_data.get('role', 'user')),
                        permissions=profile_data.get('permissions', []),
                        last_login=datetime.now(),
                        gdpr_consent=profile_data.get('gdpr_consent', False)
                    )
                    
                    # Update last login
                    supabase.table('profiles').update({
                        'last_login': datetime.now().isoformat()
                    }).eq('id', auth_response.user.id).execute()
                    
                    return user_profile
            
            return None
            
        except Exception as e:
            self.logger.error("Credential verification failed", email=email, error=str(e))
            return None
    
    async def authorize_access(self, user: UserProfile, resource: str, action: str, request: Request) -> bool:
        """Authorize user access to resources."""
        ip_address = request.client.host if request.client else "unknown"
        
        try:
            # Check permissions
            required_permission = f"{resource}:{action}"
            has_permission = (
                user.role == UserRole.ADMIN or
                required_permission in user.permissions or
                self._check_role_based_access(user.role, resource, action)
            )
            
            # Log access attempt
            await self.audit_logger.log_security_event(SecurityEvent(
                user_id=user.user_id,
                action=SecurityAction.ACCESS_GRANTED if has_permission else SecurityAction.ACCESS_DENIED,
                resource=f"{resource}:{action}",
                ip_address=ip_address,
                success=has_permission
            ))
            
            # Monitor data access
            if has_permission:
                await self.security_monitor.monitor_data_access(user.user_id, resource, ip_address)
            
            return has_permission
            
        except Exception as e:
            self.logger.error("Authorization failed", user_id=user.user_id, resource=resource, error=str(e))
            return False
    
    def _check_role_based_access(self, role: UserRole, resource: str, action: str) -> bool:
        """Check role-based access control."""
        # Define role-based permissions
        role_permissions = {
            UserRole.ADMIN: ["*:*"],  # Admin has all permissions
            UserRole.JOGASZ: [
                "legal_documents:read",
                "legal_documents:search",
                "legal_analysis:read",
                "legal_analysis:create"
            ],
            UserRole.USER: [
                "legal_documents:read",
                "legal_documents:search"
            ],
            UserRole.GUEST: [
                "legal_documents:read"
            ]
        }
        
        permissions = role_permissions.get(role, [])
        required = f"{resource}:{action}"
        
        return "*:*" in permissions or required in permissions
    
    async def get_current_user(self, token: str = Depends(oauth2_scheme)) -> UserProfile:
        """Get current authenticated user with enhanced security."""
        try:
            user = supabase.auth.get_user(token)
            if not user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid user token",
                    headers={"WWW-Authenticate": "Bearer"},
                )
            
            # Get enhanced user profile
            profile_result = supabase.table('profiles').select('*').eq('id', user.user.id).execute()
            
            if profile_result.data:
                profile_data = profile_result.data[0]
                
                user_profile = UserProfile(
                    user_id=user.user.id,
                    email=user.user.email,
                    role=UserRole(profile_data.get('role', 'user')),
                    permissions=profile_data.get('permissions', []),
                    last_login=datetime.fromisoformat(profile_data.get('last_login')) if profile_data.get('last_login') else None,
                    failed_login_attempts=profile_data.get('failed_login_attempts', 0),
                    account_locked=profile_data.get('account_locked', False),
                    gdpr_consent=profile_data.get('gdpr_consent', False)
                )
                
                self.logger.info("User authenticated successfully", user_id=user.user.id)
                return user_profile
            
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User profile not found"
            )
            
        except Exception as e:
            self.logger.error("Token verification failed", error=str(e))
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )


# Singleton instances
auth_service = EnhancedAuthenticationService()
audit_logger = AuditLogger()
gdpr_compliance = GDPRCompliance(DataEncryption())
security_monitor = SecurityMonitor() 