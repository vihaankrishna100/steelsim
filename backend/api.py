from flask import Flask, request, jsonify
from flask_cors import CORS
from __init__ import run_simulation
from ai_chatbot import SteelProductionAdvisor

app = Flask(__name__)

# Allow requests from your frontend (Next.js default: http://localhost:3000)
CORS(app, resources={r"/*": {"origins": "http://localhost:3000"}}, supports_credentials=True)

advisor = SteelProductionAdvisor()

@app.route("/simulate", methods=["POST"])
def simulate():
    data = request.get_json()
    workers = data.get("workers")
    hours = data.get("hours")
    if workers is None or hours is None:
        return jsonify({"error": "Missing workers or hours"}), 400

    results = run_simulation(workers, hours)
    try:
        analysis = advisor.analyze_simulation(results)
        results["ai_analysis"] = analysis
    except Exception as e:
        results["ai_analysis"] = f"Error generating analysis: {str(e)}"
    return jsonify(results)

@app.route("/get-advice", methods=["POST"])
def get_advice():
    data = request.get_json()
    simulation_data = data.get("simulation_data")
    question = data.get("question")
    if not simulation_data:
        return jsonify({"error": "Simulation data is required"}), 400
    try:
        if question:
            advice = advisor.get_advice_on_question(simulation_data, question)
        else:
            advice = advisor.analyze_simulation(simulation_data)
        return jsonify({"advice": advice})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/", methods=["GET"])
def root():
    return jsonify({"message": "Steel Production Simulation API"})

if __name__ == "__main__":
    # Expose to all interfaces so Next.js can reach it
    app.run(host="0.0.0.0", port=6969, debug=True)
