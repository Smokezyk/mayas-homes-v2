"""Regression checks for source-only, publication-date-safe sitemap output."""

import tempfile
import unittest
import xml.etree.ElementTree as ET
from pathlib import Path
from unittest.mock import patch

import generate_sitemap


class SitemapRegressionTests(unittest.TestCase):
    def test_packaging_and_tooling_do_not_add_public_urls(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            public = ["index.html", "pt/index.html",
                      "journal/renovation-planning/index.html",
                      "pt/journal/renovation-planning/index.html"]
            generated = ["dist/site/index.html", "dist/site/pt/index.html",
                         "build/journal/renovation-planning/index.html",
                         "node_modules/example/index.html", "vendor/example/index.html",
                         ".netlify/example/index.html"]
            for name in public + generated:
                page = root / name
                page.parent.mkdir(parents=True, exist_ok=True)
                page.write_text("<!doctype html><title>Example</title>", encoding="utf-8")
            private = root / "contact/thanks/index.html"
            private.parent.mkdir(parents=True)
            private.write_text('<meta name="robots" content="noindex,follow">', encoding="utf-8")

            with patch.object(generate_sitemap, "ROOT", root):
                xml, included, excluded = generate_sitemap.build(False)

            self.assertEqual(set(included), {
                "/", "/pt/", "/journal/renovation-planning/",
                "/pt/journal/renovation-planning/",
            })
            self.assertEqual(excluded, ["/contact/thanks/"])
            tree = ET.fromstring(xml)
            ns = {"s": "http://www.sitemaps.org/schemas/sitemap/0.9",
                  "x": "http://www.w3.org/1999/xhtml"}
            self.assertEqual(len(tree.findall("s:url", ns)), 4)
            guide = next(u for u in tree.findall("s:url", ns)
                         if u.find("s:loc", ns).text.endswith("/journal/renovation-planning/")
                         and "/pt/" not in u.find("s:loc", ns).text)
            self.assertEqual({x.attrib["hreflang"]: x.attrib["href"]
                              for x in guide.findall("x:link", ns)}, {
                "en": "https://mayashomes.com/journal/renovation-planning/",
                "pt-PT": "https://mayashomes.com/pt/journal/renovation-planning/",
                "x-default": "https://mayashomes.com/journal/renovation-planning/",
            })

    def test_generation_does_not_invent_publication_dates(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / "index.html").write_text("<title>Existing page</title>", encoding="utf-8")
            with patch.object(generate_sitemap, "ROOT", root):
                first, _, _ = generate_sitemap.build(False)
                second, _, _ = generate_sitemap.build(False)
            self.assertEqual(first, second)
            self.assertNotIn("<lastmod>", first)
            self.assertFalse((root / "sitemap.xml").exists())


if __name__ == "__main__":
    unittest.main()
