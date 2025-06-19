#!/usr/bin/env python3
"""
Comprehensive Integration Test for Hungarian Legal AI System
Tests all implemented components and their integration points
"""

import sys
import asyncio
import logging
from pathlib import Path

# Add src to path
sys.path.insert(0, str(Path(__file__).parent / "src"))
sys.path.insert(0, str(Path(__file__).parent / "app"))

async def test_agent_system():
    """Test the enhanced agent system"""
    print("🔍 Testing Agent System Integration...")
    
    try:
        # Test base agent architecture
        from energia_ai.agents.base import BaseAgent, AgentConfig, AgentStatus, AgentResult
        print("  ✅ Base agent imports successful")
        
        # Test task understanding agent
        from energia_ai.agents.task_understanding_agent import TaskUnderstandingAgent
        print("  ✅ Task understanding agent imports successful")
        
        # Test agent manager
        from energia_ai.agents.manager import agent_manager
        print("  ✅ Agent manager imports successful")
        
        # Test agent instantiation
        config = AgentConfig(max_concurrent_executions=2, timeout_seconds=30)
        task_agent = TaskUnderstandingAgent(config=config)
        print("  ✅ Task understanding agent instantiation successful")
        
        # Test agent registration
        agent_manager.register_agent(task_agent)
        print("  ✅ Agent registration successful")
        
        # Test agent retrieval
        retrieved_agent = agent_manager.get_agent("task_understanding_agent")
        assert retrieved_agent is not None
        print("  ✅ Agent retrieval successful")
        
        # Test agent info
        agent_info = retrieved_agent.get_info()
        assert "name" in agent_info
        assert "status" in agent_info
        assert "metrics" in agent_info
        print("  ✅ Agent info retrieval successful")
        
        print("✅ Agent System Integration: PASSED\n")
        return True
        
    except Exception as e:
        print(f"❌ Agent System Integration: FAILED - {e}\n")
        return False

async def test_document_chunking():
    """Test the Hungarian legal document chunking system"""
    print("🔍 Testing Document Chunking Integration...")
    
    try:
        # Test document chunker imports
        from nlp.document_chunker import HungarianLegalChunker, DocumentChunk, ChunkType
        print("  ✅ Document chunker imports successful")
        
        # Test chunker instantiation
        chunker = HungarianLegalChunker()
        print("  ✅ Chunker instantiation successful")
        
        # Test Hungarian legal document chunking
        test_text = """
        I. Cím
        Általános rendelkezések
        
        1. § (1) Ez a törvény a villamos energia termelését szabályozza.
        (2) A törvény hatálya kiterjed az energiahatékonyságra is.
        
        2. § A törvény alkalmazásában:
        a) villamos energia: elektromos áram formájában előállított energia,
        b) szolgáltató: az energiaszolgáltatást végző társaság.
        """
        
        chunks = chunker.chunk_document(test_text)
        assert len(chunks) > 0
        print(f"  ✅ Document chunking successful ({len(chunks)} chunks created)")
        
        # Test chunk validation
        validation = chunker.validate_chunks(chunks)
        assert validation["valid"] == True
        print("  ✅ Chunk validation successful")
        
        # Test chunk summary
        summary = chunker.get_chunk_summary(chunks)
        assert "total_chunks" in summary
        print("  ✅ Chunk summary generation successful")
        
        # Test Hungarian legal pattern recognition
        legal_chunks = [c for c in chunks if c.chunk_type in [ChunkType.SECTION, ChunkType.TITLE]]
        assert len(legal_chunks) > 0
        print("  ✅ Hungarian legal pattern recognition successful")
        
        print("✅ Document Chunking Integration: PASSED\n")
        return True
        
    except Exception as e:
        print(f"❌ Document Chunking Integration: FAILED - {e}\n")
        return False

async def test_monitoring_system():
    """Test the Magyar Közlöny monitoring system"""
    print("🔍 Testing Magyar Közlöny Monitor Integration...")
    
    try:
        # Test monitor imports
        from monitoring.magyar_kozlony_monitor import (
            MagyarKozlonyMonitor, 
            PublicationItem, 
            ChangeNotification,
            PublicationPatternAnalyzer,
            ChangeDetectionEngine,
            NotificationManager
        )
        print("  ✅ Monitor imports successful")
        
        # Test monitor instantiation
        monitor = MagyarKozlonyMonitor()
        print("  ✅ Monitor instantiation successful")
        
        # Test pattern analyzer
        analyzer = PublicationPatternAnalyzer()
        print("  ✅ Pattern analyzer instantiation successful")
        
        # Test change detection engine
        change_detector = ChangeDetectionEngine()
        print("  ✅ Change detection engine instantiation successful")
        
        # Test notification manager
        notification_manager = NotificationManager()
        print("  ✅ Notification manager instantiation successful")
        
        # Test mock publication processing
        from datetime import datetime
        mock_pub = PublicationItem(
            publication_id="test_001",
            title="Test energia törvény módosítás",
            publication_date=datetime.now(),
            url="https://test.hu/mock",
            content_hash="test_hash",
            item_type="law",
            legal_references=["2007. évi LXXXVI. törvény"]
        )
        
        # Test importance calculation
        importance = change_detector.calculate_importance_level(mock_pub)
        assert importance in ["low", "medium", "high", "critical"]
        print(f"  ✅ Importance calculation successful (level: {importance})")
        
        # Test monitoring status
        status = await monitor.get_monitoring_status()
        assert "monitoring_active" in status
        print("  ✅ Monitor status retrieval successful")
        
        print("✅ Magyar Közlöny Monitor Integration: PASSED\n")
        return True
        
    except Exception as e:
        print(f"❌ Magyar Közlöny Monitor Integration: FAILED - {e}\n")
        return False

async def test_security_system():
    """Test the enhanced security and privacy framework"""
    print("🔍 Testing Security System Integration...")
    
    try:
        # Test security imports
        from energia_ai.security.authentication import (
            EnhancedAuthenticationService,
            UserRole,
            SecurityEvent,
            SecurityAction,
            DataEncryption,
            AuditLogger,
            GDPRCompliance,
            SecurityMonitor,
            UserProfile
        )
        print("  ✅ Security system imports successful")
        
        # Test encryption system
        encryption = DataEncryption()
        test_data = "sensitive information"
        encrypted = encryption.encrypt_sensitive_data(test_data)
        decrypted = encryption.decrypt_sensitive_data(encrypted)
        assert decrypted == test_data
        print("  ✅ Data encryption/decryption successful")
        
        # Test data anonymization
        test_user_data = {
            "email": "test@example.com",
            "name": "Test User",
            "other_field": "keep this"
        }
        anonymized = encryption.anonymize_personal_data(test_user_data)
        assert anonymized["email"] != test_user_data["email"]
        assert "anonymized" in anonymized["email"]
        print("  ✅ Data anonymization successful")
        
        # Test audit logger
        audit_logger = AuditLogger()
        test_event = SecurityEvent(
            user_id="test_user",
            action=SecurityAction.LOGIN,
            success=True
        )
        print("  ✅ Security event creation successful")
        
        # Test GDPR compliance
        gdpr = GDPRCompliance(encryption)
        print("  ✅ GDPR compliance system instantiation successful")
        
        # Test security monitor
        security_monitor = SecurityMonitor()
        print("  ✅ Security monitor instantiation successful")
        
        # Test enhanced authentication service
        auth_service = EnhancedAuthenticationService()
        print("  ✅ Enhanced authentication service instantiation successful")
        
        # Test user roles
        assert UserRole.ADMIN.value == "admin"
        assert UserRole.JOGASZ.value == "jogasz"
        print("  ✅ User role system successful")
        
        print("✅ Security System Integration: PASSED\n")
        return True
        
    except Exception as e:
        print(f"❌ Security System Integration: FAILED - {e}\n")
        return False

async def test_api_integration():
    """Test API endpoint integration"""
    print("🔍 Testing API Integration...")
    
    try:
        # Test AI API endpoints
        from energia_ai.api.ai.endpoints import router
        print("  ✅ AI API endpoints import successful")
        
        # Test Claude client integration
        from energia_ai.ai.claude_client import get_claude_client
        print("  ✅ Claude client import successful")
        
        print("✅ API Integration: PASSED\n")
        return True
        
    except Exception as e:
        print(f"❌ API Integration: FAILED - {e}\n")
        return False

async def test_system_integration():
    """Test overall system integration"""
    print("🔍 Testing Overall System Integration...")
    
    try:
        # Test main application
        from energia_ai.main import app
        print("  ✅ Main FastAPI application import successful")
        
        # Test configuration
        from energia_ai.config.settings import get_settings
        settings = get_settings()
        print("  ✅ Configuration system successful")
        
        # Test logging
        from energia_ai.core.logging import setup_logging
        logger = setup_logging()
        print("  ✅ Logging system successful")
        
        print("✅ Overall System Integration: PASSED\n")
        return True
        
    except Exception as e:
        print(f"❌ Overall System Integration: FAILED - {e}\n")
        return False

async def run_integration_tests():
    """Run all integration tests"""
    print("🚀 Starting Hungarian Legal AI System Integration Tests\n")
    print("=" * 60)
    
    test_results = []
    
    # Run all tests
    test_results.append(await test_agent_system())
    test_results.append(await test_document_chunking())
    test_results.append(await test_monitoring_system())
    test_results.append(await test_security_system())
    test_results.append(await test_api_integration())
    test_results.append(await test_system_integration())
    
    # Print summary
    print("=" * 60)
    print("📊 INTEGRATION TEST SUMMARY")
    print("=" * 60)
    
    passed = sum(test_results)
    total = len(test_results)
    
    test_names = [
        "Agent System",
        "Document Chunking", 
        "Magyar Közlöny Monitor",
        "Security Framework",
        "API Integration",
        "Overall System"
    ]
    
    for i, (name, result) in enumerate(zip(test_names, test_results)):
        status = "✅ PASSED" if result else "❌ FAILED"
        print(f"{i+1}. {name}: {status}")
    
    print(f"\n🎯 Overall Result: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 ALL INTEGRATION TESTS PASSED!")
        print("✅ Hungarian Legal AI System is fully integrated and operational!")
    else:
        print("⚠️  Some integration issues detected.")
        print("🔧 Review failed components and fix integration issues.")
    
    return passed == total

if __name__ == "__main__":
    # Set up basic logging
    logging.basicConfig(level=logging.WARNING)  # Reduce noise
    
    # Run integration tests
    success = asyncio.run(run_integration_tests())
    
    # Exit with appropriate code
    sys.exit(0 if success else 1) 