"""
Enhanced Magyar Kozlony Monitoring System
Monitors Magyar Kozlony publications for new legal documents and changes.
"""
import asyncio
import logging
import structlog
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional, Set
from dataclasses import dataclass, field
import re
import hashlib
import json
from pathlib import Path

logger = structlog.get_logger(__name__)


@dataclass
class PublicationItem:
    """Represents a Magyar Közlöny publication item."""
    publication_id: str
    title: str
    publication_date: datetime
    url: str
    content_hash: str
    item_type: str  # law, decree, decision, announcement
    legal_references: List[str] = field(default_factory=list)
    metadata: Dict[str, Any] = field(default_factory=dict)
    change_type: str = "new"  # new, modified, deleted
    importance_level: str = "medium"  # low, medium, high, critical


@dataclass
class ChangeNotification:
    """Represents a change notification to be sent."""
    notification_id: str
    publication_item: PublicationItem
    notification_type: str  # email, webhook, database
    recipients: List[str]
    timestamp: datetime
    sent: bool = False


class PublicationPatternAnalyzer:
    """Analyzes Magyar Közlöny publication patterns."""
    
    def __init__(self):
        self.logger = logger.bind(component="pattern_analyzer")
        
    def analyze_publication_patterns(self, publications: List[PublicationItem]) -> Dict[str, Any]:
        """Analyze publication patterns for better monitoring."""
        if not publications:
            return {"error": "No publications to analyze"}
        
        analysis = {
            "total_publications": len(publications),
            "publication_frequency": {},
            "content_types": {},
            "importance_distribution": {},
            "peak_publication_times": [],
            "legal_reference_patterns": {},
            "analysis_timestamp": datetime.now().isoformat()
        }
        
        # Analyze publication frequency by date
        date_counts = {}
        hour_counts = {}
        type_counts = {}
        importance_counts = {}
        reference_patterns = {}
        
        for pub in publications:
            # Date frequency
            date_key = pub.publication_date.strftime("%Y-%m-%d")
            date_counts[date_key] = date_counts.get(date_key, 0) + 1
            
            # Hour distribution
            hour_key = pub.publication_date.hour
            hour_counts[hour_key] = hour_counts.get(hour_key, 0) + 1
            
            # Content types
            type_counts[pub.item_type] = type_counts.get(pub.item_type, 0) + 1
            
            # Importance levels
            importance_counts[pub.importance_level] = importance_counts.get(pub.importance_level, 0) + 1
            
            # Legal reference patterns
            for ref in pub.legal_references:
                ref_type = self._classify_legal_reference(ref)
                reference_patterns[ref_type] = reference_patterns.get(ref_type, 0) + 1
        
        analysis["publication_frequency"] = date_counts
        analysis["content_types"] = type_counts
        analysis["importance_distribution"] = importance_counts
        analysis["legal_reference_patterns"] = reference_patterns
        
        # Find peak publication hours
        if hour_counts:
            avg_publications_per_hour = sum(hour_counts.values()) / len(hour_counts)
            peak_hours = [hour for hour, count in hour_counts.items() 
                         if count > avg_publications_per_hour * 1.5]
            analysis["peak_publication_times"] = sorted(peak_hours)
        
        return analysis
    
    def _classify_legal_reference(self, reference: str) -> str:
        """Classify legal reference types."""
        if "törvény" in reference.lower():
            return "law"
        elif "rendelet" in reference.lower():
            return "decree"  
        elif "határozat" in reference.lower():
            return "decision"
        else:
            return "other"


class ChangeDetectionEngine:
    """Advanced change detection for publications."""
    
    def __init__(self):
        self.logger = logger.bind(component="change_detection")
        self._previous_state: Dict[str, str] = {}
        
    def detect_changes(self, current_publications: List[PublicationItem],
                      previous_publications: List[PublicationItem]) -> List[PublicationItem]:
        """Detect changes between current and previous publication states."""
        changes = []
        
        # Create lookup dictionaries
        current_dict = {pub.publication_id: pub for pub in current_publications}
        previous_dict = {pub.publication_id: pub for pub in previous_publications}
        
        # Detect new publications
        for pub_id, pub in current_dict.items():
            if pub_id not in previous_dict:
                pub.change_type = "new"
                changes.append(pub)
                self.logger.info("New publication detected", publication_id=pub_id, title=pub.title)
        
        # Detect modified publications
        for pub_id, current_pub in current_dict.items():
            if pub_id in previous_dict:
                previous_pub = previous_dict[pub_id]
                if current_pub.content_hash != previous_pub.content_hash:
                    current_pub.change_type = "modified"
                    changes.append(current_pub)
                    self.logger.info("Modified publication detected", publication_id=pub_id)
        
        # Detect deleted publications
        for pub_id, pub in previous_dict.items():
            if pub_id not in current_dict:
                pub.change_type = "deleted"
                changes.append(pub)
                self.logger.info("Deleted publication detected", publication_id=pub_id)
        
        return changes
    
    def calculate_importance_level(self, publication: PublicationItem) -> str:
        """Calculate importance level based on content analysis."""
        importance_score = 0
        title_lower = publication.title.lower()
        
        # Critical indicators
        critical_terms = ["törvény", "alkotmány", "rendkívüli", "sürgős", "veszélyhelyzet"]
        if any(term in title_lower for term in critical_terms):
            importance_score += 4
        
        # High importance indicators  
        high_terms = ["rendelet", "határozat", "módosítás", "energia", "villamos"]
        if any(term in title_lower for term in high_terms):
            importance_score += 2
        
        # Medium importance indicators
        medium_terms = ["közlemény", "tájékoztató", "felhívás"]
        if any(term in title_lower for term in medium_terms):
            importance_score += 1
        
        # Legal references increase importance
        importance_score += min(len(publication.legal_references), 2)
        
        if importance_score >= 4:
            return "critical"
        elif importance_score >= 2:
            return "high"
        elif importance_score >= 1:
            return "medium"
        else:
            return "low"


class NotificationManager:
    """Manages notifications for publication changes."""
    
    def __init__(self):
        self.logger = logger.bind(component="notification_manager")
        self._notification_queue: List[ChangeNotification] = []
        
    async def create_notifications(self, changes: List[PublicationItem],
                                 notification_config: Dict[str, Any]) -> List[ChangeNotification]:
        """Create notifications for detected changes."""
        notifications = []
        
        for change in changes:
            # Filter based on importance level
            min_importance = notification_config.get("min_importance_level", "medium")
            if not self._meets_importance_threshold(change.importance_level, min_importance):
                continue
            
            notification = ChangeNotification(
                notification_id=f"notif_{change.publication_id}_{datetime.now().timestamp()}",
                publication_item=change,
                notification_type=notification_config.get("type", "database"),
                recipients=notification_config.get("recipients", []),
                timestamp=datetime.now()
            )
            
            notifications.append(notification)
            self._notification_queue.append(notification)
            
            self.logger.info("Notification created", 
                           notification_id=notification.notification_id,
                           change_type=change.change_type,
                           importance=change.importance_level)
        
        return notifications
    
    def _meets_importance_threshold(self, item_importance: str, threshold: str) -> bool:
        """Check if item importance meets notification threshold."""
        importance_levels = {"low": 1, "medium": 2, "high": 3, "critical": 4}
        return importance_levels.get(item_importance, 0) >= importance_levels.get(threshold, 0)
    
    async def send_notifications(self) -> int:
        """Send pending notifications."""
        sent_count = 0
        
        for notification in self._notification_queue:
            if not notification.sent:
                try:
                    await self._send_notification(notification)
                    notification.sent = True
                    sent_count += 1
                except Exception as e:
                    self.logger.error("Failed to send notification", 
                                    notification_id=notification.notification_id,
                                    error=str(e))
        
        # Remove sent notifications
        self._notification_queue = [n for n in self._notification_queue if not n.sent]
        
        return sent_count
    
    async def _send_notification(self, notification: ChangeNotification):
        """Send individual notification."""
        # This would integrate with actual notification services
        # For now, just log the notification
        self.logger.info("Sending notification",
                        notification_type=notification.notification_type,
                        publication_title=notification.publication_item.title,
                        change_type=notification.publication_item.change_type,
                        importance=notification.publication_item.importance_level)


class MagyarKozlonyMonitor:
    """Enhanced Magyar Közlöny monitoring system."""
    
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        self.logger = logger.bind(component="magyar_kozlony_monitor")
        self.config = config or self._default_config()
        
        # Initialize components
        self.pattern_analyzer = PublicationPatternAnalyzer()
        self.change_detector = ChangeDetectionEngine()
        self.notification_manager = NotificationManager()
        
        # State management
        self.previous_publications: List[PublicationItem] = []
        self.monitoring_active = False
        
        # URLs and endpoints
        self.base_url = "https://magyarkozlony.hu"
        self.rss_feed_url = "https://magyarkozlony.hu/rss"
        
        self.logger.info("Magyar Közlöny monitor initialized", config=self.config)
    
    def _default_config(self) -> Dict[str, Any]:
        """Default configuration for the monitor."""
        return {
            "check_interval_minutes": 60,
            "max_historical_days": 7,
            "notification_config": {
                "type": "database",
                "min_importance_level": "medium",
                "recipients": []
            },
            "content_extraction": {
                "extract_full_text": True,
                "extract_legal_references": True,
                "calculate_content_hash": True
            }
        }
    
    async def start_monitoring(self):
        """Start the monitoring process."""
        self.monitoring_active = True
        self.logger.info("Starting Magyar Közlöny monitoring")
        
        while self.monitoring_active:
            try:
                await self.check_publications()
                check_interval = self.config.get("check_interval_minutes", 60) * 60  # Convert to seconds
                await asyncio.sleep(check_interval)
            except Exception as e:
                self.logger.error("Monitor error", error=str(e))
                await asyncio.sleep(300)  # Wait 5 minutes on error
    
    def stop_monitoring(self):
        """Stop the monitoring process."""
        self.monitoring_active = False
        self.logger.info("Magyar Közlöny monitoring stopped")
    
    async def check_publications(self) -> List[PublicationItem]:
        """Check for new publications and changes."""
        self.logger.info("Checking Magyar Közlöny for new publications")
        
        try:
            # Fetch current publications
            current_publications = await self._fetch_current_publications()
            
            # Calculate importance levels
            for pub in current_publications:
                pub.importance_level = self.change_detector.calculate_importance_level(pub)
            
            # Detect changes
            changes = self.change_detector.detect_changes(current_publications, self.previous_publications)
            
            if changes:
                self.logger.info("Changes detected", change_count=len(changes))
                
                # Create notifications
                notifications = await self.notification_manager.create_notifications(
                    changes, self.config["notification_config"]
                )
                
                # Send notifications
                sent_count = await self.notification_manager.send_notifications()
                self.logger.info("Notifications processed", sent_count=sent_count)
                
                # Analyze patterns
                pattern_analysis = self.pattern_analyzer.analyze_publication_patterns(current_publications)
                self.logger.info("Pattern analysis completed", patterns=pattern_analysis)
            
            # Update state
            self.previous_publications = current_publications
            
            return current_publications
            
        except Exception as e:
            self.logger.error("Error checking publications", error=str(e))
            return []
    
    async def _fetch_current_publications(self) -> List[PublicationItem]:
        """Fetch current publications from Magyar Közlöny."""
        publications = []
        
        try:
            # For now, return mock data - full implementation would fetch from actual sources
            # This is a placeholder for the actual implementation
            mock_publication = PublicationItem(
                publication_id="mock_001",
                title="Energia törvény módosítás",
                publication_date=datetime.now(),
                url="https://magyarkozlony.hu/mock/001",
                content_hash="mock_hash_001",
                item_type="law",
                legal_references=["2007. évi LXXXVI. törvény"],
                metadata={"source": "mock", "test": True}
            )
            publications.append(mock_publication)
            
            self.logger.info("Publications fetched", count=len(publications))
            return publications
            
        except Exception as e:
            self.logger.error("Error fetching publications", error=str(e))
            return []
    
    def _extract_legal_references(self, text: str) -> List[str]:
        """Extract legal references from text."""
        references = []
        
        # Hungarian legal reference patterns
        patterns = [
            r'\d{4}\.\s*évi\s*[IVXLCDM]+\.\s*törvény',  # Laws
            r'\d+/\d{4}\.\s*\([IVXLCDM]+\.\s*\d+\.\)\s*Korm\.\s*rendelet',  # Gov decrees
            r'\d+/\d{4}\.\s*\([IVXLCDM]+\.\s*\d+\.\)\s*[A-Z]+\s*rendelet',  # Ministry decrees
            r'BH\s*\d{4}\.\s*\d+',  # Court decisions
            r'EBH\s*\d{4}\.\s*[A-Z]\.\d+',  # Supreme Court decisions
        ]
        
        for pattern in patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            references.extend(matches)
        
        return list(set(references))  # Remove duplicates
    
    async def run(self):
        """Legacy run method for backward compatibility."""
        await self.start_monitoring()
    
    async def get_monitoring_status(self) -> Dict[str, Any]:
        """Get current monitoring status and statistics."""
        return {
            "monitoring_active": self.monitoring_active,
            "last_check": datetime.now().isoformat(),
            "total_publications_tracked": len(self.previous_publications),
            "pending_notifications": len(self.notification_manager._notification_queue),
            "config": self.config,
            "uptime": "calculated_uptime_would_go_here"
        }


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    monitor = MagyarKozlonyMonitor()
    asyncio.run(monitor.run())
