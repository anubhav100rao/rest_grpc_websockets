async function fetchSequential(urls) {
	const start = performance.now();
	const results = [];
	for (const url of urls) {
		try {
			const res = await fetch(url);
			// Optionally: await res.text() or res.json() depending on use
			const text = await res.text(); // read body
			results.push({ url, status: res.status, length: text.length });
		} catch (err) {
			results.push({ url, error: err.message });
		}
	}
	const end = performance.now();
	console.log(
		`Sequential: fetched ${urls.length} URLs in ${(end - start).toFixed(
			2
		)} ms`
	);
	return { time: end - start, results };
}

async function fetchParallel(urls) {
	const start = performance.now();
	// Start all fetches immediately
	const promises = urls.map(async (url) => {
		try {
			const res = await fetch(url);
			const text = await res.text();
			return { url, status: res.status, length: text.length };
		} catch (err) {
			return { url, error: err.message };
		}
	});
	const results = await Promise.all(promises);
	const end = performance.now();
	console.log(
		`Parallel: fetched ${urls.length} URLs in ${(end - start).toFixed(
			2
		)} ms`
	);
	return { time: end - start, results };
}

(async () => {
	const urls = [
		"https://jsonplaceholder.typicode.com/todos/1",
		"https://jsonplaceholder.typicode.com/todos/2",
		"https://jsonplaceholder.typicode.com/todos/3",
		// add more URLs as desired
	];

	console.log("Starting sequential fetch...");
	const seq = await fetchSequential(urls);
	// Optionally inspect seq.results

	console.log("Starting parallel fetch...");
	const par = await fetchParallel(urls);
	// Optionally inspect par.results

	console.log("Summary:");
	console.log(`  Sequential total time: ${seq.time.toFixed(2)} ms`);
	console.log(`  Parallel total time:   ${par.time.toFixed(2)} ms`);
})();
