import fitz

def create_sample_pdf():
    doc = fitz.open()
    page = doc.new_page()
    
    text = """
    Space Exploration: The Journey to Mars
    
    Mars is the fourth planet from the Sun and is often called the 'Red Planet' because of its reddish appearance. 
    It is a cold, desert world with a very thin atmosphere. Mars has two small moons, Phobos and Deimos.
    
    Humans have sent many robotic missions to Mars. The Perseverance rover landed in February 2021 to search for signs of ancient life. 
    NASA and other space agencies are planning to send humans to Mars in the 2030s. 
    
    The gravity on Mars is about 38% of Earth's gravity, meaning you could jump much higher on Mars than on Earth!
    """
    
    page.insert_text((50, 50), text, fontsize=12)
    doc.save("Sample_Study_Space.pdf")
    doc.close()

if __name__ == "__main__":
    create_sample_pdf()
    print("Sample_Study_Space.pdf created!")
