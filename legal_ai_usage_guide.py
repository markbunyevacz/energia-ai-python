"""
Energia AI Legal System - Complete Usage Guide and Demo
Shows how to effectively use your current legal AI capabilities
"""
import asyncio
import json
import sys
import os
from datetime import datetime
try:
    from dotenv import load_dotenv
except ImportError:
    def load_dotenv():
        pass

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

# Load environment variables
load_dotenv()

try:
    from energia_ai.ai.claude_client import ClaudeClient
    CLAUDE_AVAILABLE = True
except ImportError as e:
    print(f"⚠️  Warning: Could not import ClaudeClient: {e}")
    CLAUDE_AVAILABLE = False

class LegalAIUsageDemo:
    """Comprehensive demo of your legal AI system"""
    
    def __init__(self):
        self.claude_client = ClaudeClient() if CLAUDE_AVAILABLE else None
    
    async def demo_basic_analysis(self):
        """Demo 1: Basic Legal Document Analysis"""
        print("\n" + "="*60)
        print("📋 DEMO 1: Basic Legal Document Analysis")
        print("="*60)
        
        sample_law = """
        2023. évi XVIII. törvény
        az épületek energiahatékonyságáról
        
        1. § E törvény hatálya kiterjed:
        a) lakóépületekre,
        b) nem lakás célú épületekre,
        c) közintézményekre.
        
        2. § Az energetikai tanúsítvány megújítása:
        a) 10 évente kötelező,
        b) jelentős felújítás esetén azonnal,
        c) tulajdonváltáskor szükséges.
        
        3. § A nem megfelelő tanúsítvánnyal rendelkező épületek esetében
        100.000 - 500.000 Ft bírság szabható ki.
        """
        
        if not self.claude_client:
            print("❌ Claude client not available")
            return
        
        print("📄 Analyzing Hungarian energy efficiency law...")
        
        # Basic analysis
        result = await self.claude_client.analyze_legal_document(
            sample_law, 
            analysis_type="general"
        )
        
        print(f"✅ Analysis completed")
        print(f"🔤 Tokens used: {result['token_usage']['input_tokens']} input, {result['token_usage']['output_tokens']} output")
        print(f"📝 Analysis preview:")
        print("-" * 40)
        print(result['analysis'][:300] + "...")
        
        return result
    
    async def demo_document_summarization(self):
        """Demo 2: Advanced Document Summarization"""
        print("\n" + "="*60)
        print("📋 DEMO 2: Document Summarization")
        print("="*60)
        
        regulation_text = """
        15/2023. (VI. 15.) BM rendelet
        a lakóépületek energetikai követelményeiről
        
        A belügyminiszter a vonatkozó EU irányelvek alapján a következőket rendeli el:
        
        I. Fejezet - Általános rendelkezések
        
        1. § (1) E rendelet alkalmazásában:
        a) energetikai követelmény: az épület energiafelhasználásának maximális mértéke,
        b) energetikai tanúsítvány: az épület energiahatékonysági besorolását tartalmazó okirat,
        c) energetikai auditor: megfelelő képesítéssel rendelkező szakember.
        
        2. § Az energetikai tanúsítvány tartalmazza:
        a) az épület energiahatékonysági osztályát (A++ - G skála),
        b) az éves energiafelhasználás mértékét,
        c) a javítási javaslatok listáját,
        d) a tanúsítvány érvényességi idejét.
        
        II. Fejezet - Kötelezettségek
        
        3. § (1) A tulajdonos köteles:
        a) energetikai tanúsítványt készíttetni,
        b) a tanúsítványt naprakészen tartani,
        c) vásárlónak/bérlőnek bemutatni.
        
        4. § (1) Az energetikai auditor feladata:
        a) az épület helyszíni vizsgálata,
        b) energetikai számítások elvégzése,
        c) javítási javaslatok kidolgozása.
        
        III. Fejezet - Szankciók
        
        5. § (1) A tanúsítvány elmulasztása esetén 50.000-200.000 Ft bírság.
        (2) Hibás tanúsítvány esetén 100.000-300.000 Ft bírság.
        (3) Ismételt jogsértés esetén a bírság kétszerese.
        """
        
        if not self.claude_client:
            print("❌ Claude client not available")
            return
        
        print("📄 Generating comprehensive summary...")
        
        # Generate summary
        summary = await self.claude_client.generate_legal_summary(
            regulation_text, 
            summary_length="detailed"
        )
        
        print(f"✅ Summary generated")
        print(f"📝 Document Summary:")
        print("-" * 40)
        print(summary)
        
        return summary
    
    async def demo_key_points_extraction(self):
        """Demo 3: Key Points Extraction"""
        print("\n" + "="*60)
        print("📋 DEMO 3: Key Points Extraction")
        print("="*60)
        
        contract_text = """
        ENERGIASZOLGÁLTATÁSI SZERZŐDÉS
        
        Szerződő felek:
        Szolgáltató: Zöld Energia Kft. (1234 Budapest, Energia út 1.)
        Vevő: Példa Vállalkozás Zrt. (5678 Debrecen, Ipari park 10.)
        
        1. A szerződés tárgya
        A szolgáltató vállalja, hogy a vevő részére 100%-ban megújuló 
        energiaforrásokból származó villamosenergiát szállít.
        
        2. Mennyiség és teljesítmény
        - Éves energiamennyiség: 500 MWh
        - Maximum teljesítmény: 250 kW
        - Garantált rendelkezésre állás: 99,5%
        
        3. Ár és fizetési feltételek
        - Energiaár: 45 Ft/kWh + ÁFA
        - Kapacitásdíj: 8.500 Ft/kW/hó + ÁFA
        - Fizetési határidő: 15 nap
        
        4. Szerződés időtartama
        - Hatálybalépés: 2024. január 1.
        - Lejárat: 2026. december 31.
        - Automatikus meghosszabbítás: 1 év
        
        5. Szankciók
        - Késedelmi kamat: jegybanki alapkamat + 8%
        - Szállítási hiba esetén: -10% árcsökkentés
        - Vis maior esetén felelősség kizárása
        
        6. Felmondás
        - Rendes felmondás: 3 hónapos felmondási idő
        - Rendkívüli felmondás: azonnali hatályú súlyos szerződésszegés esetén
        """
        
        if not self.claude_client:
            print("❌ Claude client not available")
            return
        
        print("📄 Extracting key points from energy contract...")
        
        # Extract key points
        key_points = await self.claude_client.extract_key_points(contract_text)
        
        print(f"✅ Key points extracted: {len(key_points)} points found")
        print(f"📝 Key Points:")
        print("-" * 40)
        
        for i, point in enumerate(key_points, 1):
            print(f"{i}. {point}")
        
        return key_points
    
    async def demo_legal_qa(self):
        """Demo 4: Legal Question Answering"""
        print("\n" + "="*60)
        print("📋 DEMO 4: Legal Question Answering")
        print("="*60)
        
        questions = [
            "Milyen gyakran kell megújítani a lakóépületek energetikai tanúsítványát?",
            "Mekkora bírság járhat a tanúsítvány elmulasztása miatt?",
            "Ki jogosult energetikai tanúsítvány készítésére?",
            "Mikor kell energetikai tanúsítványt bemutatni?",
            "Milyen adatokat tartalmaz az energetikai tanúsítvány?"
        ]
        
        if not self.claude_client:
            print("❌ Claude client not available")
            return
        
        results = []
        
        for i, question in enumerate(questions, 1):
            print(f"\n❓ Question {i}: {question}")
            
            answer_result = await self.claude_client.answer_legal_question(question)
            
            print(f"📝 Answer preview: {answer_result['answer'][:200]}...")
            print(f"🔤 Tokens: {answer_result['token_usage']['input_tokens']} + {answer_result['token_usage']['output_tokens']}")
            
            results.append({
                "question": question,
                "answer": answer_result['answer'],
                "tokens": answer_result['token_usage']
            })
        
        return results
    
    async def demo_contextual_analysis(self):
        """Demo 5: Contextual Legal Analysis"""
        print("\n" + "="*60)
        print("📋 DEMO 5: Contextual Legal Analysis")
        print("="*60)
        
        main_document = """
        Energia-audit jelentés
        XY Irodaház energetikai vizsgálata
        
        Épület adatok:
        - Alapterület: 2.500 m²
        - Építés éve: 1985
        - Utolsó felújítás: 2010
        
        Jelenlegi energiafogyasztás:
        - Fűtés: 180 kWh/m²/év
        - Hűtés: 45 kWh/m²/év
        - Világítás: 25 kWh/m²/év
        - Összes: 250 kWh/m²/év
        
        Energetikai besorolás: D kategória
        
        Javasolt intézkedések:
        1. Homlokzat hőszigetelése - 35% megtakarítás
        2. Nyílászárók cseréje - 20% megtakarítás  
        3. LED világítás - 60% világítási megtakarítás
        4. Hőszivattyú rendszer - 45% fűtési megtakarítás
        
        Beruházási költség: 85 millió Ft
        Várható megtérülés: 8-10 év
        """
        
        context_documents = [
            """
            2023. évi XVIII. törvény 2. §
            Az energetikai tanúsítvány megújítása jelentős felújítás esetén kötelező.
            Jelentős felújításnak minősül, ha a felújítás költsége meghaladja 
            az épület értékének 25%-át.
            """,
            """
            Európai Uniós irányelv
            Az épületek energiahatékonyságáról szóló 2010/31/EU irányelv szerint
            a D energetikai kategóriájú épületek 2030-ig legalább C kategóriára 
            javítandók.
            """
        ]
        
        if not self.claude_client:
            print("❌ Claude client not available")
            return
        
        print("📄 Performing contextual analysis with supporting documents...")
        
        question = "Milyen jogi kötelezettségek vonatkoznak erre az épületre a tervezett felújítás kapcsán?"
        
        result = await self.claude_client.answer_legal_question(
            question, 
            context_documents=[main_document] + context_documents
        )
        
        print(f"✅ Contextual analysis completed")
        print(f"❓ Question: {question}")
        print(f"📝 Analysis:")
        print("-" * 40)
        print(result['answer'])
        print(f"\n🔤 Tokens used: {result['token_usage']['input_tokens']} + {result['token_usage']['output_tokens']}")
        
        return result
    
    async def run_full_demo(self):
        """Run all demos"""
        print("🚀 ENERGIA AI LEGAL SYSTEM - COMPLETE DEMO")
        print("="*80)
        print("This demo showcases your current legal AI capabilities")
        print("="*80)
        
        if not CLAUDE_AVAILABLE:
            print("❌ Claude client not available. Please:")
            print("1. Ensure you have a .env file with ANTHROPIC_API_KEY or CLAUDE_API_KEY")
            print("2. Run: pip install -r requirements.txt")
            print("3. Check your API key is valid")
            return
        
        results = {}
        
        try:
            # Demo 1: Basic Analysis
            results['basic_analysis'] = await self.demo_basic_analysis()
            
            # Demo 2: Summarization
            results['summarization'] = await self.demo_document_summarization()
            
            # Demo 3: Key Points
            results['key_points'] = await self.demo_key_points_extraction()
            
            # Demo 4: Q&A
            results['qa_results'] = await self.demo_legal_qa()
            
            # Demo 5: Contextual Analysis
            results['contextual_analysis'] = await self.demo_contextual_analysis()
            
            # Summary
            print("\n" + "="*60)
            print("🎉 DEMO COMPLETED SUCCESSFULLY!")
            print("="*60)
            print("Your Energia AI system demonstrated:")
            print("✅ Legal document analysis")
            print("✅ Document summarization")
            print("✅ Key points extraction")
            print("✅ Legal question answering")
            print("✅ Contextual analysis with multiple documents")
            print("\n💡 Next steps:")
            print("1. Test with your own legal documents")
            print("2. Integrate with your web interface")
            print("3. Add document upload functionality")
            print("4. Implement user authentication")
            print("5. Add database storage for analysis history")
            
            return results
            
        except Exception as e:
            print(f"❌ Demo failed: {e}")
            print("\n🔧 Troubleshooting:")
            print("1. Check your internet connection")
            print("2. Verify your Claude API key")
            print("3. Ensure all dependencies are installed")
            return None

# Quick test function
async def quick_test():
    """Quick test of the system"""
    print("🧪 Quick System Test")
    print("-" * 30)
    
    api_key = os.getenv('ANTHROPIC_API_KEY') or os.getenv('CLAUDE_API_KEY')
    if api_key:
        print(f"✅ API Key found: {api_key[:10]}...")
    else:
        print("❌ No API key found in environment")
        return False
    
    if CLAUDE_AVAILABLE:
        print("✅ Claude client import successful")
        
        demo = LegalAIUsageDemo()
        try:
            result = await demo.claude_client.analyze_legal_document(
                "Tesztelési célú jogi szöveg az energiahatékonyságról.",
                analysis_type="summary"
            )
            print(f"✅ Quick analysis test passed")
            print(f"   Tokens: {result['token_usage']['input_tokens']} + {result['token_usage']['output_tokens']}")
            return True
        except Exception as e:
            print(f"❌ Analysis test failed: {e}")
            return False
    else:
        print("❌ Claude client import failed")
        return False

if __name__ == "__main__":
    success = asyncio.run(quick_test())
    if success:
        print("✅ System is working!")
    else:
        print("❌ System needs configuration") 