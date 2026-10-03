package archive;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;

import java.io.IOException;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.Executors;

/**
 * The Lychrel Archive — Java Core + Embedded HTTP server.
 * Zero external dependencies. Compiles with JDK 17+.
 */
public final class Lychrel {

    public static final int ITERATION_LIMIT = 500;

    public record Analysis(
            String seed,
            boolean isLychrel,
            int iterations,
            int peakDigits,
            String palindrome,
            double elapsedMs,
            List<String> preview
    ) {}

    private Lychrel() {}

    public static boolean isPalindrome(String value) {
        int left = 0;
        int right = value.length() - 1;
        while (left < right) {
            if (value.charAt(left) != value.charAt(right)) return false;
            left++;
            right--;
        }
        return true;
    }

    public static String reverseDigits(String value) {
        return new StringBuilder(value).reverse().toString();
    }

    public static String addStrings(String a, String b) {
        int i = a.length() - 1;
        int j = b.length() - 1;
        int carry = 0;
        StringBuilder out = new StringBuilder(Math.max(a.length(), b.length()) + 1);
        while (i >= 0 || j >= 0 || carry > 0) {
            int da = i >= 0 ? a.charAt(i) - '0' : 0;
            int db = j >= 0 ? b.charAt(j) - '0' : 0;
            int total = da + db + carry;
            out.append((char) ('0' + (total % 10)));
            carry = total / 10;
            i--;
            j--;
        }
        return out.reverse().toString();
    }

    public static Analysis analyze(String seed) {
        return analyze(seed, ITERATION_LIMIT);
    }

    public static Analysis analyze(String seed, int limit) {
        if (seed == null || !seed.matches("[0-9]+") || seed.chars().allMatch(c -> c == '0')) {
            throw new IllegalArgumentException("seed must be a positive integer string");
        }
        long start = System.nanoTime();

        String current = seed;
        int peak = current.length();
        List<String> preview = new ArrayList<>();
        preview.add(current);
        int iterations = 0;

        for (int step = 0; step < limit; step++) {
            iterations = step + 1;
            current = addStrings(current, reverseDigits(current));
            if (current.length() > peak) peak = current.length();
            if (preview.size() < 8) preview.add(current);
            if (isPalindrome(current)) {
                double elapsed = (System.nanoTime() - start) / 1_000_000.0;
                return new Analysis(seed, false, iterations, peak, current, elapsed, preview);
            }
        }

        double elapsed = (System.nanoTime() - start) / 1_000_000.0;
        return new Analysis(seed, true, iterations, peak, null, elapsed, preview);
    }

    public static boolean isLychrel(long n) {
        if (n <= 0) return false;
        return analyze(Long.toString(n)).isLychrel();
    }

    public static boolean isLychrel(String n) {
        if (n == null || !n.matches("[0-9]+") || n.chars().allMatch(c -> c == '0')) {
            return false;
        }
        return analyze(n).isLychrel();
    }

    /* ---------------- Embedded HTTP server ---------------- */

    public static void main(String[] args) throws IOException {
        // Self-test the canonical cases before starting the server.
        Map<Long, Boolean> cases = new LinkedHashMap<>();
        cases.put(12L, false);
        cases.put(55L, false);
        cases.put(196L, true);
        cases.put(879L, true);
        cases.put(44987L, false);
        cases.put(7059L, true);

        for (Map.Entry<Long, Boolean> entry : cases.entrySet()) {
            boolean got = isLychrel(entry.getKey());
            String tag = got == entry.getValue() ? "ok" : "FAIL";
            System.out.printf("[self-test] isLychrel(%d) = %b  [%s]%n",
                    entry.getKey(), got, tag);
        }

        int port = Integer.parseInt(System.getenv().getOrDefault("PORT", "8788"));
        HttpServer server = HttpServer.create(new InetSocketAddress(port), 0);
        server.setExecutor(Executors.newFixedThreadPool(4));

        server.createContext("/api/health", Lychrel::handleHealth);
        server.createContext("/api/analyze", Lychrel::handleAnalyze);

        server.start();
        System.out.printf("[lychrel-archive] listening on http://localhost:%d%n", port);
    }

    private static void handleHealth(HttpExchange exchange) throws IOException {
        if (!"GET".equals(exchange.getRequestMethod())) {
            respond(exchange, 405, "{\"error\":\"method not allowed\"}");
            return;
        }
        respond(exchange, 200,
                "{\"ok\":true,\"service\":\"lychrel-archive-java\",\"iterationLimit\":"
                        + ITERATION_LIMIT + "}");
    }

    private static void handleAnalyze(HttpExchange exchange) throws IOException {
        if (!"GET".equals(exchange.getRequestMethod())) {
            respond(exchange, 405, "{\"error\":\"method not allowed\"}");
            return;
        }
        String path = exchange.getRequestURI().getPath();
        // /api/analyze/<seed>
        String prefix = "/api/analyze/";
        if (!path.startsWith(prefix) || path.length() <= prefix.length()) {
            respond(exchange, 400, "{\"error\":\"usage: /api/analyze/<seed>\"}");
            return;
        }
        String seed = path.substring(prefix.length());
        try {
            Analysis a = analyze(seed);
            String json = toJson(a);
            respond(exchange, 200, json);
        } catch (IllegalArgumentException ex) {
            respond(exchange, 400, "{\"error\":\"" + ex.getMessage() + "\"}");
        }
    }

    private static String toJson(Analysis a) {
        StringBuilder sb = new StringBuilder();
        sb.append('{');
        sb.append("\"seed\":\"").append(a.seed()).append("\",");
        sb.append("\"isLychrel\":").append(a.isLychrel()).append(',');
        sb.append("\"iterations\":").append(a.iterations()).append(',');
        sb.append("\"peakDigits\":").append(a.peakDigits()).append(',');
        sb.append("\"palindrome\":");
        if (a.palindrome() == null) {
            sb.append("null");
        } else {
            sb.append('"').append(a.palindrome()).append('"');
        }
        sb.append(',');
        sb.append("\"elapsedMs\":").append(String.format("%.3f", a.elapsedMs())).append(',');
        sb.append("\"preview\":[");
        for (int i = 0; i < a.preview().size(); i++) {
            if (i > 0) sb.append(',');
            sb.append('"').append(a.preview().get(i)).append('"');
        }
        sb.append("]}");
        return sb.toString();
    }

    private static void respond(HttpExchange exchange, int status, String body)
            throws IOException {
        byte[] bytes = body.getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().add("Content-Type", "application/json; charset=utf-8");
        exchange.getResponseHeaders().add("Access-Control-Allow-Origin", "*");
        exchange.sendResponseHeaders(status, bytes.length);
        try (OutputStream out = exchange.getResponseBody()) {
            out.write(bytes);
        }
    }
}
