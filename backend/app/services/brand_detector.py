"""
Modular Brand Impersonation Detector
Examines domain structure, typo-squatting, homoglyphs, and brand injection.
"""

from typing import Dict, Any, List
from ml.features.extractor import detect_brand_impersonation, TARGET_BRANDS, LEGITIMATE_BRAND_DOMAINS

class BrandDetectorService:
    @staticmethod
    def analyze(domain: str, url: str) -> Dict[str, Any]:
        result = detect_brand_impersonation(domain, url)
        return result

    @staticmethod
    def get_supported_brands() -> List[str]:
        return sorted(TARGET_BRANDS)
