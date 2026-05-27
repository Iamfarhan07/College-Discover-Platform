import "dotenv/config";
import { prisma } from "../lib/prisma";
import bcrypt from "bcryptjs";

async function main() {
  console.log("Start seeding...");

  // 1. Clean existing database records (cascade delete will take care of children if deleting parents,
  // but explicitly cleaning is safer to reset IDs if possible, or just delete in order)
  await prisma.savedCollege.deleteMany({});
  await prisma.review.deleteMany({});
  await prisma.placement.deleteMany({});
  await prisma.course.deleteMany({});
  await prisma.college.deleteMany({});
  await prisma.user.deleteMany({});

  console.log("Cleared existing database data.");

  // 2. Create test users
  const passwordHash = await bcrypt.hash("password123", 10);
  const user1 = await prisma.user.create({
    data: {
      name: "Test User One",
      email: "test@example.com",
      passwordHash,
    },
  });

  const user2 = await prisma.user.create({
    data: {
      name: "Test User Two",
      email: "user2@example.com",
      passwordHash,
    },
  });

  console.log("Created test users:", user1.email, user2.email);

  const users = [user1, user2];

  // 3. Define 20 realistic colleges
  const collegesData = [
    {
      name: "Indian Institute of Technology Bombay (IIT Bombay)",
      location: "Mumbai, Maharashtra",
      fees: 850000,
      rating: 4.9,
      type: "Public",
      established: 1958,
      overview: "IIT Bombay is a premier public technical and research university located in Mumbai. It is globally recognized for its academic excellence, cutting-edge research, and top-tier placements.",
      imageUrl: "https://images.unsplash.com/photo-1562774053-701939374585",
      courses: [
        { name: "B.Tech Computer Science and Engineering", duration: "4 years", fees: 900000 },
        { name: "B.Tech Electrical Engineering", duration: "4 years", fees: 850000 },
        { name: "M.Tech Mechanical Engineering", duration: "2 years", fees: 200000 },
      ],
      placement: {
        averagePackage: 2180000,
        highestPackage: 15000000,
        topRecruiters: ["Google", "Microsoft", "Apple", "Uber", "Rubrik"],
      },
      reviews: [
        { comment: "Incredible coding culture and academic rigor. Unmatched opportunities.", rating: 5.0 },
        { comment: "Hostel facilities are decent, but the campus life is absolutely elite.", rating: 4.5 },
      ],
    },
    {
      name: "Indian Institute of Technology Delhi (IIT Delhi)",
      location: "New Delhi, Delhi",
      fees: 880000,
      rating: 4.8,
      type: "Public",
      established: 1961,
      overview: "Located in the capital city, IIT Delhi is celebrated for its highly selective admissions, intense competitive culture, and startup ecosystem.",
      imageUrl: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f",
      courses: [
        { name: "B.Tech Computer Science and Engineering", duration: "4 years", fees: 920000 },
        { name: "B.Tech Chemical Engineering", duration: "4 years", fees: 880000 },
        { name: "M.Tech Data Science", duration: "2 years", fees: 250000 },
      ],
      placement: {
        averagePackage: 2050000,
        highestPackage: 12000000,
        topRecruiters: ["Goldman Sachs", "Jane Street", "Meta", "Microsoft"],
      },
      reviews: [
        { comment: "Rigorous academics but gives great startup exposure.", rating: 4.7 },
        { comment: "Fests are amazing, campus is green and centrally located.", rating: 4.9 },
      ],
    },
    {
      name: "Birla Institute of Technology and Science (BITS Pilani)",
      location: "Pilani, Rajasthan",
      fees: 1850000,
      rating: 4.7,
      type: "Private",
      established: 1964,
      overview: "BITS Pilani is one of India's top private universities, famous for its 'No Reservation' policy, 'Zero Attendance' rule, and a strong global alumni network.",
      imageUrl: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1",
      courses: [
        { name: "B.E. Computer Science", duration: "4 years", fees: 1950000 },
        { name: "B.E. Electronics & Communication", duration: "4 years", fees: 1850000 },
        { name: "M.Sc. Physics (Dual Degree)", duration: "5 years", fees: 2200000 },
      ],
      placement: {
        averagePackage: 1560000,
        highestPackage: 6000000,
        topRecruiters: ["Amazon", "Nvidia", "Oracle", "Qualcomm", "Cisco"],
      },
      reviews: [
        { comment: "The zero attendance policy gives you time to follow your passion.", rating: 5.0 },
        { comment: "Expensive but the infrastructure and peer group justify it.", rating: 4.4 },
      ],
    },
    {
      name: "Indian Institute of Science (IISc Bangalore)",
      location: "Bangalore, Karnataka",
      fees: 120000,
      rating: 4.9,
      type: "Public",
      established: 1909,
      overview: "IISc is India's leading research institution, offering advanced scientific research and technical education with a beautiful wooded campus in Bangalore.",
      imageUrl: "https://images.unsplash.com/photo-1507537297725-24a1c029d3ca",
      courses: [
        { name: "Bachelor of Science (Research)", duration: "4 years", fees: 120000 },
        { name: "M.Tech Computer Science", duration: "2 years", fees: 80000 },
        { name: "Ph.D. Physics", duration: "5 years", fees: 50000 },
      ],
      placement: {
        averagePackage: 2200000,
        highestPackage: 8600000,
        topRecruiters: ["Intel", "Samsung Research", "IBM Research", "Google"],
      },
      reviews: [
        { comment: "The best place in India for scientific research. World-class faculty.", rating: 5.0 },
        { comment: "Very research-oriented, not like typical engineering colleges.", rating: 4.8 },
      ],
    },
    {
      name: "Delhi Technological University (DTU)",
      location: "Delhi, Delhi",
      fees: 760000,
      rating: 4.3,
      type: "Public",
      established: 1941,
      overview: "Formerly known as Delhi College of Engineering (DCE), DTU is one of India's oldest and most prestigious engineering institutions, located in North Delhi.",
      imageUrl: "https://images.unsplash.com/photo-1592280771190-3e2e4d571952",
      courses: [
        { name: "B.Tech Software Engineering", duration: "4 years", fees: 800000 },
        { name: "B.Tech Mechanical Engineering", duration: "4 years", fees: 760000 },
        { name: "M.B.A. Business Analytics", duration: "2 years", fees: 450000 },
      ],
      placement: {
        averagePackage: 1240000,
        highestPackage: 6400000,
        topRecruiters: ["Amazon", "Adobe", "Paytm", "Deloitte", "McKinsey"],
      },
      reviews: [
        { comment: "Great campus life and very relaxed attendance rules compared to IITs.", rating: 4.5 },
        { comment: "Placements are outstanding, especially for tech branches.", rating: 4.2 },
      ],
    },
    {
      name: "Netaji Subhas University of Technology (NSUT)",
      location: "New Delhi, Delhi",
      fees: 780000,
      rating: 4.2,
      type: "Public",
      established: 1983,
      overview: "NSUT, formerly NSIT, is a premier state university located in Dwarka, Delhi. It is highly regarded for its computer engineering and electronics programs.",
      imageUrl: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1",
      courses: [
        { name: "B.Tech Computer Engineering", duration: "4 years", fees: 820000 },
        { name: "B.Tech Information Technology", duration: "4 years", fees: 800000 },
        { name: "M.Tech VLSI Design", duration: "2 years", fees: 280000 },
      ],
      placement: {
        averagePackage: 1200000,
        highestPackage: 5500000,
        topRecruiters: ["Microsoft", "Salesforce", "DE Shaw", "Directi"],
      },
      reviews: [
        { comment: "Competitive peer group. Placements are neck-to-neck with DTU.", rating: 4.3 },
        { comment: "Campus infra is developing fast, fests are great fun.", rating: 4.1 },
      ],
    },
    {
      name: "Vellore Institute of Technology (VIT Vellore)",
      location: "Vellore, Tamil Nadu",
      fees: 790000,
      rating: 4.1,
      type: "Private",
      established: 1984,
      overview: "VIT is a private deemed university known for its massive student population, flexible credit system, and modern computing infrastructure.",
      imageUrl: "https://images.unsplash.com/photo-1562774053-701939374585",
      courses: [
        { name: "B.Tech Computer Science and Engineering", duration: "4 years", fees: 840000 },
        { name: "B.Tech Biotechnology", duration: "4 years", fees: 790000 },
        { name: "M.C.A.", duration: "2 years", fees: 280000 },
      ],
      placement: {
        averagePackage: 850000,
        highestPackage: 4400000,
        topRecruiters: ["TCS", "Cognizant", "Wipro", "Intel", "Microsoft"],
      },
      reviews: [
        { comment: "Great infrastructure and choice of teachers via FFCS.", rating: 4.2 },
        { comment: "Rules in hostels are extremely strict (especially for girls).", rating: 4.0 },
      ],
    },
    {
      name: "Manipal Institute of Technology (MIT Manipal)",
      location: "Manipal, Karnataka",
      fees: 1620000,
      rating: 4.2,
      type: "Private",
      established: 1957,
      overview: "Part of MAHE, MIT Manipal is famous for its holistic student development, top-tier labs, and vibrant student town life in coastal Karnataka.",
      imageUrl: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f",
      courses: [
        { name: "B.Tech Computer Science", duration: "4 years", fees: 1750000 },
        { name: "B.Tech Aeronautical Engineering", duration: "4 years", fees: 1620000 },
        { name: "M.Tech Software Engineering", duration: "2 years", fees: 380000 },
      ],
      placement: {
        averagePackage: 1050000,
        highestPackage: 4800000,
        topRecruiters: ["Microsoft", "Amazon", "Schneider Electric", "TCS"],
      },
      reviews: [
        { comment: "The student life in Manipal is unmatched. Freedom and good studies.", rating: 4.5 },
        { comment: "Somewhat expensive, but facilities are top class.", rating: 3.9 },
      ],
    },
    {
      name: "SRM Institute of Science and Technology",
      location: "Chennai, Tamil Nadu",
      fees: 1000000,
      rating: 4.0,
      type: "Private",
      established: 1985,
      overview: "SRM IST is a multi-campus private university in Chennai, featuring advanced medical and technical labs and hosting students from all over India.",
      imageUrl: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1",
      courses: [
        { name: "B.Tech CSE with Artificial Intelligence", duration: "4 years", fees: 1100000 },
        { name: "B.Tech Mechanical Engineering", duration: "4 years", fees: 1000000 },
        { name: "M.Tech Robotics", duration: "2 years", fees: 300000 },
      ],
      placement: {
        averagePackage: 780000,
        highestPackage: 4200000,
        topRecruiters: ["Infosys", "Capgemini", "Amazon", "IBM", "Cognizant"],
      },
      reviews: [
        { comment: "Massive campus. Very diverse student background.", rating: 4.1 },
        { comment: "Management is focused on placements. Average packages are decent.", rating: 3.9 },
      ],
    },
    {
      name: "College of Engineering Pune (COEP)",
      location: "Pune, Maharashtra",
      fees: 380000,
      rating: 4.4,
      type: "Public",
      established: 1854,
      overview: "COEP is the third oldest engineering college in Asia. Located in Pune, it is highly selective and known for its strong technical clubs and hands-on projects.",
      imageUrl: "https://images.unsplash.com/photo-1507537297725-24a1c029d3ca",
      courses: [
        { name: "B.Tech Computer Engineering", duration: "4 years", fees: 400000 },
        { name: "B.Tech Electronics & Telecommunication", duration: "4 years", fees: 380000 },
        { name: "M.Tech Structural Engineering", duration: "2 years", fees: 180000 },
      ],
      placement: {
        averagePackage: 980000,
        highestPackage: 3600000,
        topRecruiters: ["Tata Motors", "Barclays", "Citi", "John Deere", "Siemens"],
      },
      reviews: [
        { comment: "Very prestigious in Maharashtra. Excellent alumni support.", rating: 4.6 },
        { comment: "Excellent focus on practical skills and club activities.", rating: 4.2 },
      ],
    },
    {
      name: "RV College of Engineering (RVCE)",
      location: "Bangalore, Karnataka",
      fees: 980000,
      rating: 4.3,
      type: "Private",
      established: 1963,
      overview: "RVCE is a top-ranked private engineering college in Bangalore, recognized for its excellent placements in the IT sector due to its prime Bangalore location.",
      imageUrl: "https://images.unsplash.com/photo-1592280771190-3e2e4d571952",
      courses: [
        { name: "B.E. Computer Science and Engineering", duration: "4 years", fees: 1050000 },
        { name: "B.E. Information Science", duration: "4 years", fees: 980000 },
        { name: "M.Tech Computer Science", duration: "2 years", fees: 240000 },
      ],
      placement: {
        averagePackage: 1120000,
        highestPackage: 5000000,
        topRecruiters: ["Cisco", "HP", "Akamai", "Microsoft", "Goldman Sachs"],
      },
      reviews: [
        { comment: "Perfect location in Bangalore, bringing top recruiters directly.", rating: 4.5 },
        { comment: "Academics are strict, but it pays off during placements.", rating: 4.1 },
      ],
    },
    {
      name: "PSG College of Technology",
      location: "Coimbatore, Tamil Nadu",
      fees: 420000,
      rating: 4.5,
      type: "Private",
      established: 1951,
      overview: "PSG Tech is an government-aided private engineering college known for its close industry ties, manufacturing workshops, and strong work ethic.",
      imageUrl: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1",
      courses: [
        { name: "B.Tech Information Technology", duration: "4 years", fees: 450000 },
        { name: "B.E. Mechanical Engineering (Sandwich)", duration: "5 years", fees: 500000 },
        { name: "M.E. VLSI Design", duration: "2 years", fees: 180000 },
      ],
      placement: {
        averagePackage: 920000,
        highestPackage: 3300000,
        topRecruiters: ["Qualcomm", "Caterpillar", "Intel", "Robert Bosch", "L&T"],
      },
      reviews: [
        { comment: "Outstanding core engineering labs and workshop facilities.", rating: 4.7 },
        { comment: "Discipline is high, but placement records are rock solid.", rating: 4.3 },
      ],
    },
    {
      name: "Thapar Institute of Engineering and Technology",
      location: "Patiala, Punjab",
      fees: 1480000,
      rating: 4.2,
      type: "Private",
      established: 1956,
      overview: "Thapar University is a leading private technical university located in a 250-acre red-brick campus in Patiala, offering great research and sports facilities.",
      imageUrl: "https://images.unsplash.com/photo-1562774053-701939374585",
      courses: [
        { name: "B.E. Computer Science and Engineering", duration: "4 years", fees: 1600000 },
        { name: "B.E. Electronics and Computers", duration: "4 years", fees: 1480000 },
        { name: "M.Tech Computer Applications", duration: "2 years", fees: 340000 },
      ],
      placement: {
        averagePackage: 980000,
        highestPackage: 4000000,
        topRecruiters: ["JPMC", "Infosys", "Intel", "Nvidia", "Zomato"],
      },
      reviews: [
        { comment: "Campus infrastructure is beautiful. Hostel library is top tier.", rating: 4.4 },
        { comment: "Good placement opportunities for computer branches.", rating: 4.0 },
      ],
    },
    {
      name: "National Institute of Technology Trichy (NIT Trichy)",
      location: "Trichy, Tamil Nadu",
      fees: 570000,
      rating: 4.6,
      type: "Public",
      established: 1964,
      overview: "NIT Trichy is consistently ranked as the top NIT in India, renowned for its outstanding student achievements, fests, and placement records.",
      imageUrl: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f",
      courses: [
        { name: "B.Tech Computer Science and Engineering", duration: "4 years", fees: 600000 },
        { name: "B.Tech Production Engineering", duration: "4 years", fees: 570000 },
        { name: "M.B.A.", duration: "2 years", fees: 300000 },
      ],
      placement: {
        averagePackage: 1450000,
        highestPackage: 5200000,
        topRecruiters: ["Amazon", "Uber", "Oracle", "L&T", "Morgan Stanley"],
      },
      reviews: [
        { comment: "Top-tier peer group. Fests like Festember are legendary.", rating: 4.8 },
        { comment: "Rigorous academic schedule but placements are exceptional.", rating: 4.4 },
      ],
    },
    {
      name: "National Institute of Technology Surathkal (NIT Surathkal)",
      location: "Surathkal, Karnataka",
      fees: 550000,
      rating: 4.5,
      type: "Public",
      established: 1960,
      overview: "NIT Surathkal (NITK) is a premier public university featuring its own private beach on the Arabian Sea coast, combining top academics with unique scenery.",
      imageUrl: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1",
      courses: [
        { name: "B.Tech Information Technology", duration: "4 years", fees: 580000 },
        { name: "B.Tech Mining Engineering", duration: "4 years", fees: 550000 },
        { name: "M.Tech Information Security", duration: "2 years", fees: 190000 },
      ],
      placement: {
        averagePackage: 1380000,
        highestPackage: 4900000,
        topRecruiters: ["Microsoft", "Wells Fargo", "Texas Instruments", "Qualcomm"],
      },
      reviews: [
        { comment: "Beach side campus is magical. Best engineering life.", rating: 4.7 },
        { comment: "Very strong coding culture. Almost all seniors got placed.", rating: 4.3 },
      ],
    },
    {
      name: "International Institute of Information Technology (IIIT Hyderabad)",
      location: "Hyderabad, Telangana",
      fees: 1400000,
      rating: 4.8,
      type: "Private",
      established: 1998,
      overview: "IIIT Hyderabad is a premier research university specializing in information technology, computer science, and electronics. It is famous for its competitive programming culture.",
      imageUrl: "https://images.unsplash.com/photo-1507537297725-24a1c029d3ca",
      courses: [
        { name: "B.Tech Computer Science and Engineering", duration: "4 years", fees: 1500000 },
        { name: "B.Tech Electronics & Communication", duration: "4 years", fees: 1400000 },
        { name: "M.S. by Research in CSE", duration: "2 years", fees: 400000 },
      ],
      placement: {
        averagePackage: 2600000,
        highestPackage: 7400000,
        topRecruiters: ["Google", "Facebook", "Microsoft", "Apple", "Salesforce"],
      },
      reviews: [
        { comment: "Coding standard is exceptional. GSOC selections are highest here.", rating: 4.9 },
        { comment: "Strictly research and study oriented. Extremely hectic.", rating: 4.7 },
      ],
    },
    {
      name: "Anna University",
      location: "Chennai, Tamil Nadu",
      fees: 220000,
      rating: 4.0,
      type: "Public",
      established: 1978,
      overview: "Anna University is a premier public state university, supervising engineering colleges across Tamil Nadu from its historic Guindy campus.",
      imageUrl: "https://images.unsplash.com/photo-1592280771190-3e2e4d571952",
      courses: [
        { name: "B.E. Computer Science and Engineering", duration: "4 years", fees: 240000 },
        { name: "B.E. Printing Technology", duration: "4 years", fees: 220000 },
        { name: "M.Tech Environmental Engineering", duration: "2 years", fees: 90000 },
      ],
      placement: {
        averagePackage: 680000,
        highestPackage: 2800000,
        topRecruiters: ["Cognizant", "TCS", "Infosys", "Ford", "Cisco"],
      },
      reviews: [
        { comment: "Reputed name in South India. Campus is green and historic.", rating: 4.2 },
        { comment: "Syllabus is quite traditional, but provides strong basics.", rating: 3.8 },
      ],
    },
    {
      name: "Jadavpur University",
      location: "Kolkata, West Bengal",
      fees: 10000,
      rating: 4.6,
      type: "Public",
      established: 1955,
      overview: "Jadavpur University is famous for having extremely low tuition fees (subsidized by the West Bengal government) and producing top-tier engineering talent.",
      imageUrl: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1",
      courses: [
        { name: "B.E. Computer Science and Engineering", duration: "4 years", fees: 10000 },
        { name: "B.E. Information Technology", duration: "4 years", fees: 12000 },
        { name: "M.E. Electronics Engineering", duration: "2 years", fees: 6000 },
      ],
      placement: {
        averagePackage: 1100000,
        highestPackage: 4500000,
        topRecruiters: ["Microsoft", "PwC", "Samsung", "JPMC", "Amazon"],
      },
      reviews: [
        { comment: "Incredible ROI. Practically free education with top class placements.", rating: 5.0 },
        { comment: "Great freedom and political environment, active campus life.", rating: 4.2 },
      ],
    },
    {
      name: "Amity University Noida",
      location: "Noida, Uttar Pradesh",
      fees: 1150000,
      rating: 3.8,
      type: "Private",
      established: 2005,
      overview: "Amity University Noida is a sprawling private university campus in NCR, known for its modern sports complexes, international study programs, and corporate tie-ups.",
      imageUrl: "https://images.unsplash.com/photo-1562774053-701939374585",
      courses: [
        { name: "B.Tech Computer Science", duration: "4 years", fees: 1250000 },
        { name: "B.Tech Aerospace Engineering", duration: "4 years", fees: 1150000 },
        { name: "M.B.A. International Business", duration: "2 years", fees: 700000 },
      ],
      placement: {
        averagePackage: 620000,
        highestPackage: 3000000,
        topRecruiters: ["Capgemini", "Accenture", "Wipro", "HCL Technologies"],
      },
      reviews: [
        { comment: "Lush green campus, high-tech infrastructure, outstanding sports facilities.", rating: 4.1 },
        { comment: "Fees are on the higher side, placements are good if you work hard.", rating: 3.5 },
      ],
    },
    {
      name: "Lovely Professional University (LPU)",
      location: "Phagwara, Punjab",
      fees: 720000,
      rating: 3.5,
      type: "Private",
      established: 2005,
      overview: "LPU is India's largest single-campus private university, featuring a ultra-modern campus with its own mall, hospital, and hosting students from 40+ countries.",
      imageUrl: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f",
      courses: [
        { name: "B.Tech Computer Science and Engineering", duration: "4 years", fees: 800000 },
        { name: "B.Tech Civil Engineering", duration: "4 years", fees: 720000 },
        { name: "M.B.A. Marketing", duration: "2 years", fees: 480000 },
      ],
      placement: {
        averagePackage: 580000,
        highestPackage: 3200000,
        topRecruiters: ["Cognizant", "Amazon", "Infosys", "Tech Mahindra"],
      },
      reviews: [
        { comment: "Gigantic campus with state-of-the-art facilities. Good sports culture.", rating: 3.8 },
        { comment: "Mass recruitment is common. One needs to study hard to get premium placements.", rating: 3.2 },
      ],
    },
    {
      name: "Indian Institute of Technology Madras (IIT Madras)",
      location: "Chennai, Tamil Nadu",
      fees: 900000,
      rating: 4.9,
      type: "Public",
      established: 1959,
      overview: "IIT Madras is a top-ranked engineering institute located in Chennai. It is well known for its world-class research facilities and strong industry connections.",
      imageUrl: "https://images.unsplash.com/photo-1562774053-701939374585",
      courses: [
        { name: "B.Tech Computer Science and Engineering", duration: "4 years", fees: 950000 },
        { name: "B.Tech Mechanical Engineering", duration: "4 years", fees: 900000 },
      ],
      placement: {
        averagePackage: 2240000,
        highestPackage: 13000000,
        topRecruiters: ["Google", "Microsoft", "Intel", "Nvidia"],
      },
      reviews: [
        { comment: "World class academic infrastructure.", rating: 5.0 },
        { comment: "Campus is beautiful inside a national park.", rating: 4.8 },
      ],
    },
    {
      name: "Indian Institute of Technology Kharagpur (IIT Kharagpur)",
      location: "Kharagpur, West Bengal",
      fees: 820000,
      rating: 4.8,
      type: "Public",
      established: 1951,
      overview: "IIT Kharagpur is the oldest of the IITs, featuring a massive campus and the largest student body among technical institutes.",
      imageUrl: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f",
      courses: [
        { name: "B.Tech Computer Science and Engineering", duration: "4 years", fees: 860000 },
        { name: "B.Tech Civil Engineering", duration: "4 years", fees: 820000 },
      ],
      placement: {
        averagePackage: 1900000,
        highestPackage: 12000000,
        topRecruiters: ["Apple", "Nvidia", "Uber", "Microsoft"],
      },
      reviews: [
        { comment: "Huge campus with boundless opportunities.", rating: 4.8 },
        { comment: "Academic stress is real, but the environment helps.", rating: 4.6 },
      ],
    },
    {
      name: "National Institute of Technology Rourkela (NIT Rourkela)",
      location: "Rourkela, Odisha",
      fees: 530000,
      rating: 4.4,
      type: "Public",
      established: 1961,
      overview: "NIT Rourkela is a prestigious engineering institute known for its massive green campus and top-tier labs.",
      imageUrl: "https://images.unsplash.com/photo-1507537297725-24a1c029d3ca",
      courses: [
        { name: "B.Tech Computer Science and Engineering", duration: "4 years", fees: 560000 },
        { name: "B.Tech Electrical Engineering", duration: "4 years", fees: 530000 },
      ],
      placement: {
        averagePackage: 1120000,
        highestPackage: 4800000,
        topRecruiters: ["Microsoft", "Amazon", "Deloitte", "Tata Consultancy Services"],
      },
      reviews: [
        { comment: "Good hostel facilities and campus security.", rating: 4.5 },
        { comment: "Very friendly coding environment.", rating: 4.3 },
      ],
    },
    {
      name: "Vellore Institute of Technology Chennai (VIT Chennai)",
      location: "Chennai, Tamil Nadu",
      fees: 810000,
      rating: 4.0,
      type: "Private",
      established: 2010,
      overview: "VIT Chennai is the second campus of Vellore Institute of Technology, offering modern state-of-the-art facilities in Vandalur.",
      imageUrl: "https://images.unsplash.com/photo-1592280771190-3e2e4d571952",
      courses: [
        { name: "B.Tech Computer Science and Engineering", duration: "4 years", fees: 860000 },
        { name: "B.Tech Electronics & Communication", duration: "4 years", fees: 810000 },
      ],
      placement: {
        averagePackage: 800000,
        highestPackage: 3600000,
        topRecruiters: ["TCS", "Capgemini", "Infosys", "Cognizant"],
      },
      reviews: [
        { comment: "Modern facilities, friendly environment.", rating: 4.2 },
        { comment: "Hostel rules are strict like Vellore campus.", rating: 3.8 },
      ],
    },
    {
      name: "BITS Pilani (Hyderabad Campus)",
      location: "Hyderabad, Telangana",
      fees: 1820000,
      rating: 4.6,
      type: "Private",
      established: 2008,
      overview: "BITS Hyderabad is a modern campus of BITS Pilani, boasting equal academic rigor, excellent infrastructure, and strong placement records.",
      imageUrl: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1",
      courses: [
        { name: "B.E. Computer Science", duration: "4 years", fees: 1900000 },
        { name: "B.E. Chemical Engineering", duration: "4 years", fees: 1820000 },
      ],
      placement: {
        averagePackage: 1480000,
        highestPackage: 5600000,
        topRecruiters: ["Microsoft", "Amazon", "Cisco", "Qualcomm"],
      },
      reviews: [
        { comment: "Very modern campus. Equal status to Pilani campus.", rating: 4.8 },
        { comment: "Excellent labs and library setup.", rating: 4.4 },
      ],
    },
  ];

  // 4. Create colleges, courses, placements, and reviews
  for (const cData of collegesData) {
    const { courses, placement, reviews, ...collegeFields } = cData;

    // Create college
    const college = await prisma.college.create({
      data: collegeFields,
    });

    // Create courses
    if (courses && courses.length > 0) {
      await prisma.course.createMany({
        data: courses.map((course) => ({
          ...course,
          collegeId: college.id,
        })),
      });
    }

    // Create placement
    if (placement) {
      await prisma.placement.create({
        data: {
          averagePackage: placement.averagePackage,
          highestPackage: placement.highestPackage,
          topRecruiters: placement.topRecruiters,
          collegeId: college.id,
        },
      });
    }

    // Create reviews
    if (reviews && reviews.length > 0) {
      for (let i = 0; i < reviews.length; i++) {
        const review = reviews[i];
        // Distribute reviews between user1 and user2
        const assignedUser = users[i % users.length];

        await prisma.review.create({
          data: {
            comment: review.comment,
            rating: review.rating,
            userId: assignedUser.id,
            collegeId: college.id,
          },
        });
      }
    }
  }

  console.log("Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("Seeding failed with error:", e);
    process.exit(1);
  })
  .finally(async () => {
    // Explicitly disconnect
    await prisma.$disconnect();
  });
