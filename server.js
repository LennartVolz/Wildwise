const http = require("node:http");
const path = require("node:path");
const fs = require("node:fs/promises");

const port = Number(process.env.PORT) || 3000;
const publicDirectory = path.join(__dirname, "public");
const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
};
const factLabels = {
  habitat: "Habitat",
  diet: "Diet",
  locations: "Range",
  lifespan: "Lifespan",
  top_speed: "Top speed",
  weight: "Weight",
  height: "Height",
  biggest_threat: "Biggest threat",
  group_behavior: "Group behavior",
  prey: "Prey",
  most_distinctive_feature: "Distinctive feature",
  estimated_population_size: "Estimated population",
  slogan: "Did you know?",
};

async function getAnimalInfo(query) {
  const apiKey = process.env.API_NINJAS_KEY;
  if (!apiKey) {
    const error = new Error("The API key is missing. Set the API_NINJAS_KEY environment variable.");
    error.statusCode = 503;
    throw error;
  }

  const apiUrl = new URL("https://api.api-ninjas.com/v1/animals");
  apiUrl.searchParams.set("name", query);
  const apiResponse = await fetch(apiUrl, {
    headers: { "X-Api-Key": apiKey },
    signal: AbortSignal.timeout(8000),
  });

  if (apiResponse.status === 401 || apiResponse.status === 403) {
    const error = new Error("The API key is invalid or not authorized.");
    error.statusCode = 502;
    throw error;
  }
  if (apiResponse.status === 429) {
    const error = new Error("The animal data API monthly request limit has been reached.");
    error.statusCode = 429;
    throw error;
  }
  if (!apiResponse.ok) {
    const error = new Error("The animal data service is currently unavailable.");
    error.statusCode = 502;
    throw error;
  }

  const animals = await apiResponse.json();
  if (!Array.isArray(animals) || animals.length === 0) {
    return null;
  }

  const animal = animals.find((item) => item.name?.toLowerCase() === query.toLowerCase()) || animals[0];
  const characteristics = animal.characteristics || {};
  const scientificName = animal.taxonomy?.scientific_name || characteristics.scientific_name;
  const facts = Object.entries(factLabels)
    .map(([key, label]) => {
      const value = key === "locations" ? animal.locations : characteristics[key];
      if (Array.isArray(value)) {
        return value.length ? { label, value: value.join(", ") } : null;
      }
      return typeof value === "string" && value.trim() ? { label, value: value.trim() } : null;
    })
    .filter(Boolean);

  return {
    title: animal.name,
    description: scientificName || "Animal fact file",
    facts,
    articleUrl: "https://api-ninjas.com/api/animals",
  };
}

const server = http.createServer(async (request, response) => {
  const requestUrl = new URL(request.url, `http://${request.headers.host}`);

  if (requestUrl.pathname === "/healthz") {
    response.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    response.end(JSON.stringify({ status: "ok" }));
    return;
  }

  if (requestUrl.pathname === "/api/animal") {
    if (request.method !== "GET") {
      response.writeHead(405, { "Content-Type": "application/json; charset=utf-8" });
      response.end(JSON.stringify({ error: "This method is not supported." }));
      return;
    }

    const query = (requestUrl.searchParams.get("q") || "").trim();
    if (!query || query.length > 80) {
      response.writeHead(400, { "Content-Type": "application/json; charset=utf-8" });
      response.end(JSON.stringify({ error: "Enter an animal name no longer than 80 characters." }));
      return;
    }

    try {
      const animal = await getAnimalInfo(query);
      if (!animal) {
        response.writeHead(404, { "Content-Type": "application/json; charset=utf-8" });
        response.end(JSON.stringify({ error: `No animal facts were found for "${query}".` }));
        return;
      }

      response.writeHead(200, {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
      });
      response.end(JSON.stringify(animal));
    } catch (error) {
      console.error("API Ninjas request failed:", error.message);
      response.writeHead(error.statusCode || 502, { "Content-Type": "application/json; charset=utf-8" });
      response.end(JSON.stringify({ error: error.message || "The animal data service is currently unavailable." }));
    }
    return;
  }

  const requestedPath = requestUrl.pathname === "/" ? "/index.html" : requestUrl.pathname;
  const filePath = path.resolve(publicDirectory, `.${requestedPath}`);
  if (!filePath.startsWith(`${publicDirectory}${path.sep}`)) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  try {
    const content = await fs.readFile(filePath);
    response.writeHead(200, {
      "Content-Type": mimeTypes[path.extname(filePath)] || "application/octet-stream",
    });
    response.end(content);
  } catch {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Nicht gefunden");
  }
});

server.listen(port, () => {
  console.log(`Wildwise is listening on port ${port}`);
});
