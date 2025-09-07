import os
from openai import OpenAI
from typing import Dict, Any

OPENAI_API_KEY = "proj_3bFjGh8Bi9uUWG7jm5JGy8Uwsk-proj-X4q2fQYDcbZ6kACxmrqep18Zpbx27Q5MdXUT8SgSh5GLIWeXl-hGPKcuQ6VjY1IR8Re52ltTmdT3BlbkFJe0ejaOqywSBumUb4qDJFebKgVGcekU-UeUv57jDqa1iVJOCFiHxhIkzNaohyeiM-jMBMoqJl4A"

class SteelProductionAdvisor:
    def __init__(self):
        self.client = OpenAI(api_key=OPENAI_API_KEY)

    def analyze_simulation(self, simulation_data: Dict[str, Any]) -> str:
        # Create a detailed prompt from simulation data
        prompt = self._create_analysis_prompt(simulation_data)
        
        try:
            response = self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": """You are an expert steel production advisor during the second industrial revolution so during 1879-1914. 
                    Analyze the simulation data and provide strategic advice for optimizing the steel production process.
                    Focus on worker allocation, resource efficiency, and production bottlenecks.
                    Be specific and provide actionable recommendations."""},
                    {"role": "user", "content": prompt}
                ]
            )
            return response.choices[0].message.content
        except Exception as e:
            return f"Error generating advice: {str(e)}"

    def _create_analysis_prompt(self, data: Dict[str, Any]) -> str:
        # Extract key metrics from simulation data
        hours = data['simulation_time']['hours']
        workers = data['workers']
        cycles = data['cycles']
        final_resources = data['final_resources']
        
        # Calculate key metrics based on today's data to give a sample output 
        total_steel = final_resources['steel_produced']
        avg_cycle_time = sum(cycle['end_time'] - cycle['start_time'] for cycle in cycles) / len(cycles) if cycles else 0
        steel_per_hour = total_steel / hours if hours > 0 else 0
        
        
        # Get financial data
        financial = data['financial']
        total_revenue = financial['total_revenue']
        revenue_per_hour = financial['revenue_per_hour']
        price_per_ton = financial['price_per_ton']

        prompt = f"""
        Analyze this steel production simulation and provide strategic advice:

        Production Overview:
        - Total Runtime: {hours} hours
        - Number of Workers: {workers}
        - Total Steel Produced: {total_steel} units
        - Average Cycle Time: {avg_cycle_time:.2f} minutes
        - Production Rate: {steel_per_hour:.2f} steel units per hour

        Financial Overview:
        - Price per Ton: ${price_per_ton}
        - Total Revenue: ${total_revenue:,.2f}
        - Revenue per Hour: ${revenue_per_hour:,.2f}

        Resource Status:
        - Remaining Pig Iron: {final_resources['remaining']['pig_iron']}
        - Remaining Coal: {final_resources['remaining']['coal']}
        - Remaining Limestone: {final_resources['remaining']['limestone']}
        - Remaining Air: {final_resources['remaining']['air']}
        - Slag Produced: {final_resources['remaining']['slag']}

        Process Analysis:
        """
        
        # Add analysis of each cycle
        for i, cycle in enumerate(cycles[:3], 1): 
            prompt += f"\nCycle {i}:\n"
            for step in cycle['steps']:
                prompt += f"- {step['name']}: {step['duration']} minutes\n"
        
        prompt += """
        Based on this data:
        First give a score on the efficiency of the production process (1-100) based on the amount of steel producers and other machinery as well as revenue.
        1. What are the main efficiency bottlenecks?
        2. How can worker allocation be improved?
        3. What specific changes would optimize production?
        4. Are resources being used efficiently?
        5. What is the recommended strategy for scaling up production?
        6. Where to export and import steel based on current market?
        7. Provide a concise summary of the overall performance and key recommendations.
        """
        
        return prompt

    def get_advice_on_question(self, simulation_data: Dict[str, Any], question: str) -> str:
        """Get specific advice based on a user question about the simulation. Give it in a concise manner and give statistics to prove your output."""
        context = self._create_analysis_prompt(simulation_data)
        
        try:
            response = self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are an expert steel production advisor. Answer questions based on the simulation data provided. Make sure to use the correct data and simulation data."},
                    {"role": "user", "content": f"Context:\n{context}\n\nQuestion: {question}"}
                ]
            )
            return response.choices[0].message.content
        except Exception as e:
            return f"Error generating advice: {str(e)}"







