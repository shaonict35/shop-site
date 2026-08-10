async function test() {
  const searchUrl = "https://khoj.shajgoj.com/products/1/indexes/*/queries?defaultFacet=product-category";
  
  const queries = [
    { query: "BOGO" },
    { query: "Buy 1 Get 1" },
    { query: "Combo" },
    { query: "Clearance" },
    { query: "lipstick" }
  ];

  for (const q of queries) {
    const payload = [
      {
        indexName: "products",
        params: {
          hitsPerPage: 5,
          page: 0,
          query: q.query
        }
      }
    ];

    try {
      const res = await fetch(searchUrl, {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
          "Referer": "https://shop.shajgoj.com/",
          "Origin": "https://shop.shajgoj.com"
        },
        body: JSON.stringify(payload)
      });
      console.log(`Query: "${q.query}" | Status: ${res.status}`);
      if (res.ok) {
        const data: any = await res.json();
        console.log(`  Hits: ${data.results?.[0]?.hits?.length || 0}`);
      }
    } catch (e: any) {
      console.error(`  Error: ${e.message}`);
    }
  }
}

test();
