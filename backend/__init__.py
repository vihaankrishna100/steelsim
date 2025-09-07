import simpy
import random
import statistics

# Raw materials needed as well as machinery:
# worker, bessemer converter, air blast system, charging machine, slag removal
# pig iron, air, limestone, coal


class worker():

    def __init__(self):
        self.hours = 0
        self.working = False
        self.wage = 1

    def calculate_time_reduction(base_time, num_workers):
        # More workers = faster process, but with diminishing returns
        
        reduction_factor = 1 / (1 + 0.5 * (num_workers - 1))
        return max(1, int(base_time * reduction_factor))  # Minimum 1 time unit

    def pay(self, hours):
        if self.working:
            self.hours += hours

# Global variables for simulation
num_workers = 1
workers = []



class resources():

    def __init__(self, env):
        self.env = env
        self.pig_iron = simpy.Container(env, init=1000, capacity=1000)
        self.limestone = simpy.Container(env, init=500, capacity=500)
        self.coal = simpy.Container(env, init=300, capacity=300)
        self.air = simpy.Container(env, init=10000, capacity=10000)
        self.steel = simpy.Container(env, init=0, capacity=1000)
        self.slag = simpy.Container(env, init=0, capacity=500)

class bessemer_converter():

    def __init__(self, env):
        self.num_converters = 1
        self.num_workers = num_workers
    
    def time_to_convert(self, pig_iron):
        base_time = 15  # 15 minutes for Bessemer conversion
        # Reduce time based on number of workers
        return max(1, int(base_time * (1 / (1 + 0.5 * (self.num_workers - 1)))))
    

class air_blast_system():
    
    def __init__(self):
        self.num_systems = 1
        self.num_workers = num_workers
    
    def time_to_blast(self, air):
        base_time = 10  # 10 minutes for air blast
        # Reduce time based on number of workers
        return max(1, int(base_time * (1 / (1 + 0.5 * (self.num_workers - 1)))))
    
class charging_machine():
    
    def __init__(self):
        self.num_machines = 1
        self.num_workers = num_workers
    
    def time_to_charge(self, coal):
        base_time = 8  # 8 minutes to charge materials
        # Reduce time based on number of workers
        return max(1, int(base_time * (1 / (1 + 0.5 * (self.num_workers - 1)))))
    
class slag_removal():
    
    def __init__(self):
        self.num_removers = 1
        self.num_workers = num_workers
    
    def time_to_remove(self, limestone):
        base_time = 12  # 12 minutes to remove slag baed on research 
        # Reduce time based on number of workers with the reduction factor
        return max(1, int(base_time * (1 / (1 + 0.5 * (self.num_workers - 1)))))



# Price in 1879
STEEL_PRICE_PER_TON = 19.41  

class SimulationData:
    def __init__(self):
        self.cycles = []
        self.current_cycle = {}
        self.total_revenue = 0
        
    def start_cycle(self, time):
        self.current_cycle = {
            'start_time': time,
            'steps': [],
            'resources_used': {},
            'products_made': {},
            'revenue': 0
        }
    
    def add_step(self, step_name, duration):
        self.current_cycle['steps'].append({
            'name': step_name,
            'duration': duration
        })
    
    def end_cycle(self, time):
        self.current_cycle['end_time'] = time
        self.cycles.append(self.current_cycle)
        self.current_cycle = {}

def steel_making_process(env, res, bessemer, air_system, charger, slag, sim_data):
    while True:
        sim_data.start_cycle(env.now)
        
        # Get resources for one batch
        yield res.pig_iron.get(15)
        yield res.coal.get(5)
        yield res.limestone.get(10)
        yield res.air.get(100)
        sim_data.current_cycle['resources_used'] = {
            'pig_iron': 15,
            'coal': 5,
            'limestone': 10,
            'air': 100
        }
        
        # Charging process
        charge_time = charger.time_to_charge(5)
        sim_data.add_step('charging', charge_time)
        yield env.timeout(charge_time)
        
        # Blast process
        blast_time = air_system.time_to_blast(100)
        sim_data.add_step('blast', blast_time)
        yield env.timeout(blast_time)
        
        # Bessemer conversion
        convert_time = bessemer.time_to_convert(15)
        sim_data.add_step('conversion', convert_time)
        yield env.timeout(convert_time)
        
        # Slag removal
        slag_time = slag.time_to_remove(10)
        sim_data.add_step('slag_removal', slag_time)
        yield env.timeout(slag_time)
        
        # Add resulting products
        yield res.slag.put(10)
        yield res.steel.put(12)
        steel_produced = 12  # tons of steel per cycle
        revenue = steel_produced * STEEL_PRICE_PER_TON
        
        sim_data.current_cycle['products_made'] = {
            'steel': steel_produced,
            'slag': 10
        }
        sim_data.current_cycle['revenue'] = revenue
        sim_data.total_revenue += revenue
        
        sim_data.end_cycle(env.now)
        
        # Wait before next batch
        yield env.timeout(5)

def run_simulation(num_workers, hours):
    # Setup simulation
    env = simpy.Environment()
    res = resources(env)
    bessemer = bessemer_converter(env)
    air_system = air_blast_system()
    charger = charging_machine()
    slag_remover = slag_removal()
    sim_data = SimulationData()

    # Start the process
    env.process(steel_making_process(env, res, bessemer, air_system, charger, slag_remover, sim_data))

    # Run simulation
    simulation_minutes = hours * 60
    env.run(until=simulation_minutes)

    # Collect final results
    total_steel = res.steel.level
    total_revenue = sim_data.total_revenue
    revenue_per_hour = total_revenue / hours if hours > 0 else 0
    
    results = {
        'simulation_time': {
            'hours': hours,
            'minutes': simulation_minutes
        },
        'cycles': sim_data.cycles,
        'final_resources': {
            'steel_produced': total_steel,
            'remaining': {
                'pig_iron': res.pig_iron.level,
                'coal': res.coal.level,
                'limestone': res.limestone.level,
                'air': res.air.level,
                'slag': res.slag.level
            }
        },
        'financial': {
            'total_revenue': round(total_revenue, 2),
            'revenue_per_hour': round(revenue_per_hour, 2),
            'price_per_ton': STEEL_PRICE_PER_TON
        },
        'workers': num_workers
    }
    
    return results
        



