import os
import requests
import xml.etree.ElementTree as ET
from bs4 import BeautifulSoup
from flask import Flask, jsonify, render_template

app = Flask(__name__)

# Fallback/Curated SAP AI & Agentic AI News (2026)
CURATED_NEWS = [
    {
        "id": "curated-1",
        "title": "SAP Unveils Joule Studio 2.0 for Custom AI Agent Development",
        "description": "SAP has officially rolled out Joule Studio 2.0, a low-code environment allowing developers and partners to design, build, and deploy custom AI agents tailored to specific business outcomes and complex workflows.",
        "category": "Developer Tools",
        "published": "June 15, 2026",
        "link": "https://news.sap.com/2026/06/sap-joule-studio-2-ai-agents",
        "is_curated": True,
        "tags": ["Joule", "Agentic AI", "Developer Tools"]
    },
    {
        "id": "curated-2",
        "title": "SAP and Anthropic Expand Partnership to Power Joule with Claude",
        "description": "SAP has integrated Anthropic's Claude reasoning models into its Business AI Platform, powering Joule with advanced reasoning capabilities to perform end-to-end autonomous business transactions.",
        "category": "Partnerships",
        "published": "May 28, 2026",
        "link": "https://news.sap.com/2026/05/sap-anthropic-claude-joule-agentic-ai",
        "is_curated": True,
        "tags": ["Partnerships", "Claude", "Joule"]
    },
    {
        "id": "curated-3",
        "title": "SAP Launches 'Autonomous Suite' at Sapphire 2026 to Enable Autonomous Enterprises",
        "description": "At Sapphire 2026, SAP introduced the SAP Autonomous Suite, introducing over 50 domain-specific Joule agents designed to execute complex business tasks like financial close and supply chain rerouting autonomously.",
        "category": "Strategic Vision",
        "published": "May 12, 2026",
        "link": "https://news.sap.com/2026/05/sap-sapphire-2026-autonomous-suite-agents",
        "is_curated": True,
        "tags": ["Strategic Vision", "Autonomous Suite", "Sapphire"]
    },
    {
        "id": "curated-4",
        "title": "SAP Introduces 11 Joule Agents for Autonomous Spend Management",
        "description": "The new suite of 11 Joule agents for procurement and spend management automatically flags compliance issues, verifies vendor details, and updates spend records across procurement, finance, and operations.",
        "category": "Procurement",
        "published": "April 22, 2026",
        "link": "https://news.sap.com/2026/04/sap-autonomous-spend-management-joule",
        "is_curated": True,
        "tags": ["Procurement", "Spend Management", "AI Agents"]
    },
    {
        "id": "curated-5",
        "title": "SuccessFactors Enhances Workforce Management with Learning Compliance Agents",
        "description": "New AI agents in SAP SuccessFactors automate training pathways and employee compliance monitoring. The learning agents guide users through certifications and provide context-rich HR support.",
        "category": "HR Technology",
        "published": "March 18, 2026",
        "link": "https://news.sap.com/2026/03/sap-successfactors-learning-compliance-ai-agents",
        "is_curated": True,
        "tags": ["SuccessFactors", "HR Tech", "Compliance"]
    }
]

def fetch_rss_news():
    """Fetches the official SAP RSS feed and filters for AI and Agentic AI news."""
    rss_url = "https://news.sap.com/feed"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
    
    fetched_articles = []
    
    try:
        response = requests.get(rss_url, headers=headers, timeout=10)
        if response.status_code == 200:
            root = ET.fromstring(response.content)
            # Find all <item> tags
            channel = root.find("channel")
            if channel is not None:
                items = channel.findall("item")
                for index, item in enumerate(items):
                    title = item.find("title").text if item.find("title") is not None else ""
                    link = item.find("link").text if item.find("link") is not None else ""
                    pub_date = item.find("pubDate").text if item.find("pubDate") is not None else ""
                    description_raw = item.find("description").text if item.find("description") is not None else ""
                    
                    # Strip HTML from description if any
                    soup = BeautifulSoup(description_raw, "html.parser")
                    description = soup.get_text()
                    
                    # Filter for AI keywords
                    ai_keywords = ["ai", "artificial intelligence", "agent", "agentic", "joule", "copilot", "autonomous", "machine learning", "deep learning"]
                    text_to_search = f"{title.lower()} {description.lower()}"
                    
                    if any(keyword in text_to_search for keyword in ai_keywords):
                        # Determine category based on tags/keywords
                        category = "Business AI"
                        if "agent" in text_to_search:
                            category = "Agentic AI"
                        elif "joule" in text_to_search:
                            category = "Joule Copilot"
                        elif "partner" in text_to_search or "expand" in text_to_search:
                            category = "Partnerships"
                            
                        # Extract tags
                        tags = ["SAP News"]
                        if "agent" in text_to_search:
                            tags.append("Agentic AI")
                        if "joule" in text_to_search:
                            tags.append("Joule")
                        if "copilot" in text_to_search:
                            tags.append("Copilot")
                            
                        # Format pubDate to a cleaner look (e.g. Wed, 17 Jun 2026 12:00:00 +0000 -> 17 Jun 2026)
                        formatted_date = pub_date
                        if pub_date and len(pub_date) > 16:
                            parts = pub_date.split(" ")
                            if len(parts) >= 4:
                                formatted_date = f"{parts[1]} {parts[2]} {parts[3]}"
                        
                        fetched_articles.append({
                            "id": f"rss-{index}",
                            "title": title,
                            "description": description[:300] + "..." if len(description) > 300 else description,
                            "category": category,
                            "published": formatted_date,
                            "link": link,
                            "is_curated": False,
                            "tags": list(set(tags))
                        })
    except Exception as e:
        print(f"Error fetching RSS feed: {e}")
        
    return fetched_articles

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/api/news")
def get_news():
    # Fetch live RSS items
    rss_items = fetch_rss_news()
    
    # Merge RSS items with curated ones
    # To keep the view fresh but rich, we place the RSS items first, followed by curated items.
    # We can deduplicate by title similarity or just show all.
    all_news = []
    seen_titles = set()
    
    # Add live news first
    for item in rss_items:
        title_lower = item["title"].lower().strip()
        if title_lower not in seen_titles:
            all_news.append(item)
            seen_titles.add(title_lower)
            
    # Add curated news (if they aren't somehow duplicated in RSS)
    for item in CURATED_NEWS:
        title_lower = item["title"].lower().strip()
        if title_lower not in seen_titles:
            all_news.append(item)
            seen_titles.add(title_lower)
            
    return jsonify({
        "status": "success",
        "count": len(all_news),
        "news": all_news
    })

if __name__ == "__main__":
    app.run(debug=True, port=5000)
