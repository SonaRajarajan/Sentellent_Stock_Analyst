import pytest
from app.ingester.news_rss import generate_article_hash, tag_article_sentiment, chunk_text

def test_article_hash_idempotency():
    url = "https://economictimes.indiatimes.com/news/123"
    title = "TCS Reports Strong Q3 Growth"
    hash1 = generate_article_hash(url, title)
    hash2 = generate_article_hash(url, title)
    assert hash1 == hash2, "Article hashes should be strictly deterministic for idempotency"
    assert len(hash1) == 64

def test_sentiment_tagger():
    title = "Reliance Industries Net Profit Rises 15% led by Jio expansion"
    text = "Company announces dividend beat and revenue growth"
    sentiment, impact, event_tag = tag_article_sentiment(title, text)
    assert sentiment == "Positive"
    assert impact > 0.0
    assert event_tag in ["Earnings Update", "Expansion", "Dividend Announcement"]

def test_text_chunker():
    long_text = " ".join([f"Word{i}" for i in range(400)])
    chunks = chunk_text(long_text, chunk_size=150)
    assert len(chunks) >= 3, "Should split text into overlapping chunks"
