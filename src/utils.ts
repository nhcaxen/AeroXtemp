import { GeneratedCard, FakeAddress, TempEmail } from "./types";

// Luhn Algorithm validation
export function isValidLuhn(cardNumber: string): boolean {
  const sanitized = cardNumber.replace(/\D/g, "");
  let sum = 0;
  let shouldDouble = false;
  for (let i = sanitized.length - 1; i >= 0; i--) {
    let digit = parseInt(sanitized.charAt(i));
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }
  return sum % 10 === 0;
}

// Luhn check digit completion
export function generateLuhnChecksum(partialNumber: string): string {
  let sum = 0;
  let shouldDouble = true; // since check digit is appended at index 0 from right (index length - 1)
  
  // Go backwards through the partial number
  for (let i = partialNumber.length - 1; i >= 0; i--) {
    let digit = parseInt(partialNumber.charAt(i));
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }
  
  const checkDigit = (10 - (sum % 10)) % 10;
  return checkDigit.toString();
}

// Namso Pro card generator
export function generateCards(
  binPattern: string,
  expiryMonth: string,
  expiryYear: string,
  cvv: string,
  quantity: number = 10,
  validateLuhn: boolean = true
): GeneratedCard[] {
  // Clean pattern: keep only digits, 'x', or 'X'
  let pattern = binPattern.trim().replace(/[^0-9xX]/g, "");
  if (!pattern) {
    pattern = "414720xxxxxxxxxx"; // Default Visa BIN
  }

  // Ensure pattern length is standard (typically 16, or 15 for Amex, let's pad to 16)
  const targetLength = pattern.startsWith("3") ? 15 : 16;
  while (pattern.length < targetLength) {
    pattern += "x";
  }
  if (pattern.length > targetLength) {
    pattern = pattern.substring(0, targetLength);
  }

  const results: GeneratedCard[] = [];

  for (let q = 0; q < quantity; q++) {
    let currentNum = "";
    
    // Fill in placeholders
    // For 16-digit cards, digit 16 is usually Luhn check digit.
    // For 15-digit cards, digit 15 is Luhn.
    const lengthToFill = validateLuhn ? targetLength - 1 : targetLength;

    for (let i = 0; i < lengthToFill; i++) {
      const char = pattern[i];
      if (char.toLowerCase() === "x") {
        // Random digit
        currentNum += Math.floor(Math.random() * 10).toString();
      } else {
        currentNum += char;
      }
    }

    if (validateLuhn) {
      currentNum += generateLuhnChecksum(currentNum);
    } else if (pattern.length > lengthToFill) {
      // If no Luhn validation, just fill the last character normally
      const lastChar = pattern[lengthToFill];
      currentNum += lastChar.toLowerCase() === "x" ? Math.floor(Math.random() * 10).toString() : lastChar;
    }

    // Expiry Month
    let finalMonth = expiryMonth;
    if (!finalMonth || finalMonth.toLowerCase() === "rnd") {
      const rndM = Math.floor(Math.random() * 12) + 1;
      finalMonth = rndM < 10 ? `0${rndM}` : rndM.toString();
    }

    // Expiry Year
    let finalYear = expiryYear;
    if (!finalYear || finalYear.toLowerCase() === "rnd") {
      const currentYr = new Date().getFullYear();
      finalYear = (currentYr + Math.floor(Math.random() * 8)).toString(); // 0 to 7 years in future
    } else {
      // support both YY and YYYY
      if (finalYear.length === 2) {
        finalYear = `20${finalYear}`;
      }
    }

    // CVV
    let finalCvv = cvv;
    if (!finalCvv || finalCvv.toLowerCase() === "rnd") {
      const cvvLen = pattern.startsWith("3") ? 4 : 3;
      let tempCvv = "";
      for (let i = 0; i < cvvLen; i++) {
        tempCvv += Math.floor(Math.random() * 10).toString();
      }
      finalCvv = tempCvv;
    }

    // Detect network
    let network: GeneratedCard["network"] = "Unknown";
    if (currentNum.startsWith("4")) network = "Visa";
    else if (currentNum.startsWith("5") || /^5[1-5]/.test(currentNum)) network = "Mastercard";
    else if (currentNum.startsWith("34") || currentNum.startsWith("37")) network = "Amex";
    else if (currentNum.startsWith("6")) network = "Discover";

    results.push({
      number: currentNum,
      expiryMonth: finalMonth,
      expiryYear: finalYear,
      cvv: finalCvv,
      network,
      formatted: `${currentNum}|${finalMonth}|${finalYear}|${finalCvv}`,
    });
  }

  return results;
}

// Preset BIN information database for quick inspection
export const PRESET_BINS = [
  { bin: "414720", bank: "Chase Bank", brand: "Visa", type: "Classic", level: "Signature", country: "US" },
  { bin: "542418", bank: "Citibank", brand: "Mastercard", type: "Credit", level: "World Elite", country: "US" },
  { bin: "371234", bank: "American Express", brand: "Amex", type: "Charge", level: "Green/Gold", country: "US" },
  { bin: "601100", bank: "Discover Financial", brand: "Discover", type: "Credit", level: "Standard", country: "US" },
  { bin: "453095", bank: "Barclays Bank", brand: "Visa", type: "Debit", level: "Classic", country: "UK" },
  { bin: "521100", bank: "Sberbank", brand: "Mastercard", type: "Credit", level: "Gold", country: "RU" },
  { bin: "424611", bank: "Sberbank", brand: "Visa", type: "Debit", level: "Platinum", country: "RU" },
  { bin: "510001", bank: "Deutsche Bank", brand: "Mastercard", type: "Credit", level: "Corporate", country: "DE" }
];

export function lookupBin(bin: string) {
  const sanitized = bin.substring(0, 6);
  const found = PRESET_BINS.find(item => item.bin === sanitized);
  if (found) return found;

  // Mock lookup if not in presets based on standard prefixes
  let brand = "Unknown";
  if (sanitized.startsWith("4")) brand = "Visa";
  else if (sanitized.startsWith("5")) brand = "Mastercard";
  else if (sanitized.startsWith("3")) brand = "Amex";
  else if (sanitized.startsWith("6")) brand = "Discover";

  if (brand === "Unknown") {
    return null;
  }

  // Generate deterministic mock info based on the BIN digits
  const banks = ["Wells Fargo", "Bank of America", "Capital One", "HSBC", "Lloyds Bank", "Tinkoff", "BNP Paribas", "ICICI Bank"];
  const types = ["Credit", "Debit", "Prepaid"];
  const levels = ["Standard", "Gold", "Platinum", "Infinite", "Business", "World Premium"];
  const countries = ["US", "UK", "CA", "DE", "IN", "RU", "AU", "FR"];

  const sum = sanitized.split("").reduce((acc, char) => acc + (parseInt(char) || 0), 0);

  return {
    bin: sanitized,
    bank: banks[sum % banks.length],
    brand,
    type: types[sum % types.length],
    level: levels[sum % levels.length],
    country: countries[sum % countries.length]
  };
}

// Temporary Email Names Database
const FIRST_NAMES = ["Alexander", "Dmitry", "Ekaterina", "John", "Sarah", "Liam", "Emma", "Maxim", "Sofia", "Hans", "Elena", "Rohan", "Priya"];
const LAST_NAMES = ["Smith", "Johnson", "Ivanov", "Petrov", "Müller", "Schneider", "Brown", "Wilson", "Sharma", "Patel", "Davies", "Roy"];

// Temp email mock templates
export const EMAIL_TEMPLATES = [
  {
    sender: "telegram@telegram.org",
    senderName: "Telegram Security",
    subject: "Your Telegram login code: 92837",
    content: "Hello! We received a login request from a new device. If this was you, please enter the following verification code in your app: \n\n🔒 **92837**\n\nThis code will expire in 10 minutes. If you did not request this code, you can safely ignore this email.\n\nBest regards,\nTelegram Messenger Team",
  },
  {
    sender: "noreply@github.com",
    senderName: "GitHub Team",
    subject: "[GitHub] Please verify your email address",
    content: "Welcome to GitHub, developer!\n\nTo complete your registration and unlock full access to repositories, issues, and pull requests, please verify your email address by clicking the link below or entering the code.\n\nVerification Code: **441092**\n\nHappy coding,\nThe GitHub Team",
  },
  {
    sender: "support@netflix.com",
    senderName: "Netflix Support",
    subject: "Your Netflix Temporary Access Code: 881023",
    content: "Hi Netflix Customer,\n\nHere is your temporary access code for quick authentication:\n\n🔑 **881023**\n\nThis code remains valid for 15 minutes. Never share this code with anyone. Netflix representatives will never ask you to disclose this code.\n\nEnjoy watching!\nNetflix Team",
  },
  {
    sender: "stripe-billing@stripe.com",
    senderName: "Stripe Billing",
    subject: "Action Required: Complete your card verification payment",
    content: "Hello,\n\nTo complete your trial activation and verify your card identity, please complete the small 3D Secure 2.0 verification challenge.\n\nPending Verification ID: **auth_9b1a8f9c0e**\nAmount: $0.00 (Zero-dollar Auth)\n\nThis is a standard card-active check. No real funds will be debited from your card.\n\nStripe Gateway Security",
  },
  {
    sender: "no-reply@openai.com",
    senderName: "OpenAI Auth",
    subject: "OpenAI Verification Code - 731995",
    content: "Please use the following verification code to sign in to your OpenAI account:\n\n🔑 **731995**\n\nIf you did not make this request, you can safely ignore this email.\n\nOpenAI Security Team",
  },
  {
    sender: "steam@steampowered.com",
    senderName: "Steam Guard",
    subject: "Your Steam Guard Login Code: K9X7W",
    content: "Dear Steam User,\n\nHere is the Steam Guard code needed to login to your account from a new browser:\n\n🛡️ Code: **K9X7W**\n\nThis email was sent to your temporary mailbox. If you did not initiate this login, we recommend reviewing your password settings immediately.\n\nThe Steam Support Team",
  },
  {
    sender: "notifications@discord.com",
    senderName: "Discord",
    subject: "New login detected from unknown location",
    content: "Hey there! We detected a login attempt to your Discord account from a new IP address.\n\nIf this was you, please confirm by clicking the verification link or entering this security token in your browser:\n\n✨ Token: **dc_auth_882041**\n\nKeep your account secure!\nDiscord Safety Team",
  },
  {
    sender: "verify@spotify.com",
    senderName: "Spotify Accounts",
    subject: "Confirm your email for Spotify Premium",
    content: "Thank you for joining Spotify Premium!\n\nPlease enter this activation code to complete your signup process:\n\n🎧 Code: **552199**\n\nLet the music play!\nThe Spotify Team",
  }
];

// Generate fake random incoming mail
export function generateRandomEmail(recipientEmail: string): TempEmail {
  const template = EMAIL_TEMPLATES[Math.floor(Math.random() * EMAIL_TEMPLATES.length)];
  const randomId = Math.random().toString(36).substring(2, 11);
  const now = new Date();
  const timestamp = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  return {
    id: randomId,
    sender: template.sender,
    senderName: template.senderName,
    subject: template.subject,
    content: template.content.replace("[email]", recipientEmail),
    timestamp,
    isRead: false
  };
}

// Fake address lists for multiple countries
export const COUNTRY_DATA: Record<string, {
  name: string,
  code: string,
  states: string[],
  cities: Record<string, string[]>,
  streetFormats: string[],
  streets: string[],
  postcodes: string[],
  phonePrefix: string,
  phoneFormat: string,
  ssnFormat: string,
  companyNames: string[],
  jobs: string[],
  firstNames?: string[],
  lastNames?: string[]
}> = {
  US: {
    name: "United States",
    code: "US",
    states: ["California", "New York", "Texas", "Florida", "Illinois", "Washington", "Nevada"],
    cities: {
      California: ["Los Angeles", "San Francisco", "San Diego", "San Jose"],
      "New York": ["New York City", "Buffalo", "Rochester", "Albany"],
      Texas: ["Houston", "Austin", "Dallas", "San Antonio"],
      Florida: ["Miami", "Orlando", "Tampa", "Jacksonville"],
      Illinois: ["Chicago", "Springfield", "Naperville"],
      Washington: ["Seattle", "Tacoma", "Spokane"],
      Nevada: ["Las Vegas", "Reno", "Carson City"]
    },
    streets: ["Broadway", "Sunset Blvd", "Maple Ave", "Oak Street", "Pine Lane", "Washington Road", "Pacific Coast Hwy", "Lexington Ave", "Wall Street"],
    streetFormats: ["{num} {street}", "{num} {street} Apt {apt}"],
    postcodes: ["10001", "90210", "30301", "60601", "94102", "75001", "33101"],
    phonePrefix: "+1",
    phoneFormat: "({3}) {3}-{4}",
    ssnFormat: "{3}-{2}-{4}",
    companyNames: ["Stark Industries", "Apex Tech Group", "Omni Consumer Products", "CloudGrid Solutions", "Prism Media Corp"],
    jobs: ["Lead Solutions Architect", "Senior Fullstack Engineer", "Product Design Director", "Security Operations Manager", "Financial Analyst"],
    firstNames: ["James", "John", "Robert", "Michael", "William", "David", "Richard", "Joseph", "Thomas", "Charles", "Patricia", "Jennifer", "Linda", "Elizabeth", "Barbara", "Susan", "Jessica", "Sarah", "Emily", "Jacob", "Liam", "Noah"],
    lastNames: ["Smith", "Johnson", "Williams", "Brown", "Jones", "Miller", "Davis", "Garcia", "Rodriguez", "Wilson", "Martinez", "Anderson", "Taylor", "Thomas", "White"]
  },
  UK: {
    name: "United Kingdom",
    code: "UK",
    states: ["England", "Scotland", "Wales", "Northern Ireland"],
    cities: {
      England: ["London", "Manchester", "Birmingham", "Liverpool", "Leeds"],
      Scotland: ["Edinburgh", "Glasgow", "Aberdeen"],
      Wales: ["Cardiff", "Swansea", "Newport"],
      "Northern Ireland": ["Belfast", "Derry"]
    },
    streets: ["Piccadilly", "Abbey Road", "Baker Street", "King's Road", "High Street", "Queensway", "Oxford Street", "Mill Lane"],
    streetFormats: ["{num} {street}", "Flat {apt}, {num} {street}"],
    postcodes: ["EC1A 1BB", "W1A 0AX", "M1 1AE", "EH1 1YZ", "CF10 1EP", "BT1 5GS"],
    phonePrefix: "+44",
    phoneFormat: "7700 900{3}",
    ssnFormat: "{2} {2} {2} {1} [A-D]",
    companyNames: ["Royal Crown Logistics", "Vanguard Financials", "AeroSpace UK", "Britannia Digital Services", "Cotswolds Brewing Co"],
    jobs: ["Investment Broker", "NHS Clinical Registrar", "Chartered Accountant", "SEO Strategy Consultant", "UX Copywriter"],
    firstNames: ["Oliver", "George", "Harry", "Noah", "Jack", "Leo", "Arthur", "Thomas", "Oscar", "Olivia", "Amelia", "Isla", "Ava", "Mia", "Lily", "Freya", "Emily"],
    lastNames: ["Smith", "Jones", "Taylor", "Brown", "Williams", "Wilson", "Davies", "Evans", "Thomas", "Roberts", "Johnson", "Lewis", "Walker", "Green", "Wood"]
  },
  DE: {
    name: "Germany",
    code: "DE",
    states: ["Bayern", "Berlin", "Hamburg", "Nordrhein-Westfalen", "Hessen", "Sachsen"],
    cities: {
      Bayern: ["München", "Nürnberg", "Augsburg", "Regensburg"],
      Berlin: ["Berlin"],
      Hamburg: ["Hamburg"],
      "Nordrhein-Westfalen": ["Köln", "Düsseldorf", "Dortmund", "Essen"],
      Hessen: ["Frankfurt am Main", "Wiesbaden", "Kassel"],
      Sachsen: ["Leipzig", "Dresden"]
    },
    streets: ["Hauptstraße", "Bahnhofstraße", "Schillerstraße", "Goethestraße", "Kaiserstraße", "Berliner Straße", "Ringstraße"],
    streetFormats: ["{street} {num}", "{street} {num}a", "{street} {num} Stock {apt}"],
    postcodes: ["10115", "80331", "20095", "50667", "60311", "04109"],
    phonePrefix: "+49",
    phoneFormat: "172 {3} {4}",
    ssnFormat: "{2} {6} [A-Z] {3}",
    companyNames: ["Müller & Söhne GmbH", "Kaiser AutoWerke", "Rheinland Logistik", "Berliner TechLabs", "Hessen Chemie AG"],
    jobs: ["Automotive Engineer", "Senior DevOps Consultant", "Cybersecurity Specialist", "Product Specialist", "Marketingleiter"],
    firstNames: ["Lukas", "Leon", "Ben", "Jonas", "Maximilian", "Felix", "Noah", "David", "Paul", "Emma", "Mia", "Sofia", "Hannah", "Emilia", "Anna", "Marie", "Luisa", "Klaus", "Dieter", "Wolfgang"],
    lastNames: ["Müller", "Schmidt", "Schneider", "Fischer", "Weber", "Meyer", "Wagner", "Becker", "Schulz", "Hoffmann", "Schäfer", "Koch", "Bauer", "Richter", "Klein"]
  },
  RU: {
    name: "Russia",
    code: "RU",
    states: ["Moscow Oblast", "Leningrad Oblast", "Novosibirsk Oblast", "Tatarstan Republic", "Krasnodar Krai"],
    cities: {
      "Moscow Oblast": ["Moscow", "Khimki", "Podolsk"],
      "Leningrad Oblast": ["Saint Petersburg", "Gatchina", "Vyborg"],
      "Novosibirsk Oblast": ["Novosibirsk", "Akademgorodok"],
      "Tatarstan Republic": ["Kazan", "Naberezhnye Chelny"],
      "Krasnodar Krai": ["Krasnodar", "Sochi", "Novorossiysk"]
    },
    streets: ["Tverskaya St", "Nevsky Prospect", "Arbat St", "Lenina St", "Mira Prospect", "Sadovaya St", "Gagarina St"],
    streetFormats: ["ul. {street}, d. {num}", "ul. {street}, d. {num}, kv. {apt}"],
    postcodes: ["101000", "190000", "630000", "420000", "350000"],
    phonePrefix: "+7",
    phoneFormat: "(903) {3}-{2}-{2}",
    ssnFormat: "{3}-{3}-{3} {2}",
    companyNames: ["Yandex Solutions", "SberTech", "RosAtom Consulting", "VTB Digital", "Alrosa Mining Group"],
    jobs: ["Lead Game Developer", "Data Scientist", "System Administrator", "Localisation Manager", "Security Officer"],
    firstNames: ["Dmitry", "Alexander", "Sergey", "Vladimir", "Andrey", "Alexey", "Maxim", "Mikhail", "Ivan", "Ekaterina", "Elena", "Olga", "Tatiana", "Svetlana", "Maria", "Anna", "Irina", "Yulia"],
    lastNames: ["Ivanov", "Petrov", "Smirnov", "Kuznetsov", "Popov", "Vasiliev", "Sokolov", "Novikov", "Morozov", "Volkov", "Alekseev", "Semenov", "Egorov", "Pavlov"]
  },
  CA: {
    name: "Canada",
    code: "CA",
    states: ["Ontario", "British Columbia", "Quebec", "Alberta", "Nova Scotia"],
    cities: {
      Ontario: ["Toronto", "Ottawa", "Mississauga", "Hamilton"],
      "British Columbia": ["Vancouver", "Victoria", "Burnaby"],
      Quebec: ["Montreal", "Quebec City", "Sherbrooke"],
      Alberta: ["Calgary", "Edmonton", "Red Deer"],
      "Nova Scotia": ["Halifax", "Dartmouth"]
    },
    streets: ["Yonge Street", "Robson Street", "Granville St", "Saint Catherine St", "Jasper Ave", "Bay Street", "King Street"],
    streetFormats: ["{num} {street}", "{num} {street} Suite {apt}"],
    postcodes: ["M5V 2T6", "V6B 1A1", "H2X 1Y8", "T5J 2H1", "B3J 1A1"],
    phonePrefix: "+1",
    phoneFormat: "({3}) {3}-{4}",
    ssnFormat: "{3}-{3}-{3}",
    companyNames: ["Maple Leaf Tech", "Pacific Timber Co", "Boreal Web Solutions", "Hudson Analytics", "Aurora Media"],
    jobs: ["QA Engineering Lead", "Mobile Developer", "Content Producer", "Growth Marketing Lead", "Cloud Architect"],
    firstNames: ["Liam", "Noah", "Jackson", "Lucas", "Oliver", "Benjamin", "William", "Olivia", "Emma", "Charlotte", "Amelia", "Aria", "Ava", "Chloe", "Ella", "Sophia", "James", "Justin"],
    lastNames: ["Smith", "Tremblay", "Li", "Martin", "Roy", "Gagnon", "Wilson", "Macdonald", "Taylor", "Campbell", "Johnston", "Thompson", "Robinson", "Brown", "Bouchard"]
  },
  IN: {
    name: "India",
    code: "IN",
    states: ["Maharashtra", "Karnataka", "Delhi", "Tamil Nadu", "Telangana", "West Bengal", "Gujarat", "Rajasthan", "Punjab"],
    cities: {
      Maharashtra: ["Mumbai", "Pune", "Nagpur", "Thane", "Navi Mumbai"],
      Karnataka: ["Bangalore", "Mysore", "Hubli", "Mangalore"],
      Delhi: ["New Delhi", "Noida", "Gurugram", "Dwarka"],
      "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Trichy"],
      Telangana: ["Hyderabad", "Warangal", "Secunderabad"],
      "West Bengal": ["Kolkata", "Howrah", "Siliguri"],
      Gujarat: ["Ahmedabad", "Surat", "Vadodara", "Rajkot"],
      Rajasthan: ["Jaipur", "Jodhpur", "Udaipur"],
      Punjab: ["Amritsar", "Ludhiana", "Jalandhar"]
    },
    streets: [
      "Bandra West, Linking Road", "Indiranagar, 100 Feet Road", "Saket, Press Enclave Marg", 
      "Nungambakkam High Road", "Madhapur, Hitech City Road", "Salt Lake, Sector V", 
      "Juhu Tara Road", "Koramangala 4th Block", "Connaught Place, Outer Circle", 
      "T. Nagar, Usman Road", "Gachibowli, DLF Road", "Alipore, Burdwan Road",
      "C.G. Road, Navrangpura", "Malviya Nagar, G.T. Road", "Ranjit Avenue"
    ],
    streetFormats: [
      "Flat No. {apt}, {num} {street}",
      "House No. {num}, {street}",
      "Plot No. {num}, Block C, {street}",
      "Apt {apt}, Building No. {num}, {street}"
    ],
    postcodes: ["110001", "400001", "560001", "600001", "500001", "700001", "380009", "302001", "143001"],
    phonePrefix: "+91",
    phoneFormat: "98{2}7 {5}",
    ssnFormat: "{4} {4} {4}", // Aadhaar Number
    companyNames: ["Infosys Innovations", "Tata Consulting", "Reliance Digital", "Wipro Systems", "Razorpay TechLabs", "HDFC Digital", "Zomato Core Labs", "Paytm Financial Services"],
    jobs: ["Technical Lead", "Software Development Engineer", "Product Manager", "Database Admin", "UI/UX Specialist", "DevOps Engineer", "Data Scientist", "Quality Assurance Engineer"],
    firstNames: ["Aarav", "Kabir", "Arjun", "Rohan", "Vivaan", "Ishaan", "Aditya", "Rahul", "Amit", "Vikram", "Sanjay", "Priya", "Ananya", "Diya", "Saanvi", "Meera", "Pooja", "Neha", "Sneha", "Rajesh", "Deepak", "Sunil", "Anil", "Dev", "Yash", "Karan", "Riya", "Kriti", "Shreya"],
    lastNames: ["Sharma", "Patel", "Verma", "Gupta", "Kumar", "Singh", "Rao", "Joshi", "Mehta", "Nair", "Roy", "Chatterjee", "Reddy", "Iyer", "Sen", "Banerjee", "Mishra", "Trivedi", "Choudhury", "Gill", "Mehta", "Malhotra"]
  },
  FR: {
    name: "France",
    code: "FR",
    states: ["Île-de-France", "Provence-Alpes-Côte d'Azur", "Auvergne-Rhône-Alpes", "Nouvelle-Aquitaine"],
    cities: {
      "Île-de-France": ["Paris", "Boulogne-Billancourt", "Saint-Denis", "Versailles"],
      "Provence-Alpes-Côte d'Azur": ["Marseille", "Nice", "Toulon", "Aix-en-Provence"],
      "Auvergne-Rhône-Alpes": ["Lyon", "Grenoble", "Saint-Étienne", "Villeurbanne"],
      "Nouvelle-Aquitaine": ["Bordeaux", "Limoges", "Poitiers"]
    },
    streets: ["Rue de Rivoli", "Avenue des Champs-Élysées", "Rue de la Paix", "Boulevard Saint-Germain", "Rue de la République"],
    streetFormats: ["{num} {street}", "{num} {street}, Appt {apt}"],
    postcodes: ["75001", "13001", "69001", "33000", "06000"],
    phonePrefix: "+33",
    phoneFormat: "6 {2} {2} {2} {2}",
    ssnFormat: "1 {2} {2} {2} {3} {3} {2}", // INSEE code
    companyNames: ["TotalEnergies France", "Capgemini Consulting", "Dassault Tech", "AXA Group Paris", "L'Oréal Digital"],
    jobs: ["Lead DevOps Consultant", "Cyber Defense Engineer", "Finance Manager", "Cloud Architect", "Content Manager"],
    firstNames: ["Gabriel", "Léo", "Raphaël", "Louis", "Arthur", "Lucas", "Emma", "Jade", "Louise", "Alice", "Chloé", "Lina", "Thomas", "Nicolas", "Alexandre", "Jean", "Pierre", "François"],
    lastNames: ["Martin", "Bernard", "Dubois", "Thomas", "Robert", "Richard", "Petit", "Durand", "Leroy", "Moreau", "Simon", "Laurent", "Lefebvre", "Michel", "Garcia"]
  },
  AU: {
    name: "Australia",
    code: "AU",
    states: ["New South Wales", "Victoria", "Queensland", "Western Australia"],
    cities: {
      "New South Wales": ["Sydney", "Newcastle", "Wollongong"],
      Victoria: ["Melbourne", "Geelong", "Ballarat"],
      Queensland: ["Brisbane", "Gold Coast", "Cairns"],
      "Western Australia": ["Perth", "Fremantle"]
    },
    streets: ["George Street", "Collins Street", "Queen Street", "Bourke Street", "Adelaide Street", "Swanston Street"],
    streetFormats: ["{num} {street}", "Unit {apt}, {num} {street}"],
    postcodes: ["2000", "3000", "4000", "6000", "5000"],
    phonePrefix: "+61",
    phoneFormat: "4{2} {3} {3}",
    ssnFormat: "{3} {3} {3}", // TFN Tax File Number
    companyNames: ["Atlassian Corp", "Telstra Digital", "BHP Analytics", "Canva Creative Co", "Westpac Banking"],
    jobs: ["Principal SRE", "React Core Engineer", "Strategic Growth Lead", "Visual Designer", "Technical Writer"],
    firstNames: ["Oliver", "William", "Jack", "Noah", "Thomas", "Leo", "Ethan", "Lucas", "Henry", "Charlotte", "Olivia", "Amelia", "Ava", "Mia", "Isla", "Grace", "Harper", "Chloe"],
    lastNames: ["Smith", "Jones", "Williams", "Brown", "Wilson", "Taylor", "Morton", "White", "Martin", "Anderson", "Thompson", "Nguyen", "Thomas", "Walker", "Harris"]
  },
  JP: {
    name: "Japan",
    code: "JP",
    states: ["Tokyo", "Osaka", "Kyoto", "Hokkaido", "Fukuoka"],
    cities: {
      Tokyo: ["Shinjuku", "Shibuya", "Chiyoda", "Minato"],
      Osaka: ["Umeda", "Namba", "Yodogawa"],
      Kyoto: ["Shimogyo", "Nakagyo", "Kamigyo"],
      Hokkaido: ["Sapporo", "Asahikawa", "Hakodate"],
      Fukuoka: ["Hakata", "Chuo", "Tenjin"]
    },
    streets: ["Chuo-dori", "Meiji-dori", "Shinjuku-dori", "Yasukuni-dori", "Aoyama-dori"],
    streetFormats: ["{num}-{apt} {street}", "{num} {street}"],
    postcodes: ["100-0001", "530-0001", "600-8001", "060-0001", "810-0001"],
    phonePrefix: "+81",
    phoneFormat: "90-{4}-{4}",
    ssnFormat: "{4}-{4}-{4}", // My Number Card
    companyNames: ["Sony TechLabs", "Toyota Autonomous", "Nintendo Creative", "Rakuten Commerce", "SoftBank Robotics"],
    jobs: ["Game Engine Developer", "Embedded Systems Engineer", "AI Researcher", "Web Front-End Lead", "Project Manager"],
    firstNames: ["Ren", "Haruto", "Yuto", "Sota", "Yuma", "Riku", "Kaito", "Minato", "Himari", "Hina", "Yua", "Sakura", "Ichika", "Akari", "Sara", "Aoi", "Kenji", "Takashi", "Hiroshi"],
    lastNames: ["Sato", "Suzuki", "Takahashi", "Tanaka", "Watanabe", "Ito", "Yamamoto", "Nakamura", "Kobayashi", "Kato", "Yoshida", "Yamada", "Sasaki", "Yamaguchi", "Saito"]
  },
  BR: {
    name: "Brazil",
    code: "BR",
    states: ["São Paulo", "Rio de Janeiro", "Minas Gerais", "Bahia", "Rio Grande do Sul"],
    cities: {
      "São Paulo": ["São Paulo", "Campinas", "Santos", "São Bernardo do Campo"],
      "Rio de Janeiro": ["Rio de Janeiro", "Niterói", "Duque de Caxias"],
      "Minas Gerais": ["Belo Horizonte", "Uberlândia", "Contagem"],
      Bahia: ["Salvador", "Feira de Santana"],
      "Rio Grande do Sul": ["Porto Alegre", "Caxias do Sul"]
    },
    streets: ["Avenida Paulista", "Rua Augusta", "Avenida Atlântica", "Rua das Flores", "Avenida Brasil"],
    streetFormats: ["{street}, {num}", "{street}, {num} - Apto {apt}"],
    postcodes: ["01311-000", "22021-001", "30140-010", "40015-000", "90010-000"],
    phonePrefix: "+55",
    phoneFormat: "(11) 9{4}-{4}",
    ssnFormat: "{3}.{3}.{3}-{2}", // CPF
    companyNames: ["Petrobras Digital", "Itaú Unibanco Tech", "Embraer Systems", "Nubank Core", "Magazine Luiza Lab"],
    jobs: ["Mobile Architect", "Backend Systems Engineer", "Data Security Specialist", "Scrum Master", "Product Designer"],
    firstNames: ["Miguel", "Arthur", "Heitor", "Bernardo", "Davi", "Gabriel", "Alice", "Sophia", "Helena", "Valentina", "Laura", "Isabella", "Manuela", "Julia", "Lucas", "Pedro", "João"],
    lastNames: ["Silva", "Santos", "Sousa", "Oliveira", "Pereira", "Lima", "Carvalho", "Ferreira", "Rodrigues", "Almeida", "Costa", "Gomes", "Martins", "Rocha", "Ribeiro"]
  },
  CN: {
    name: "China",
    code: "CN",
    states: ["Beijing", "Shanghai", "Guangdong", "Zhejiang", "Sichuan"],
    cities: {
      Beijing: ["Chaoyang", "Haidian", "Dongcheng", "Xicheng"],
      Shanghai: ["Pudong", "Huangpu", "Xuhui", "Jingan"],
      Guangdong: ["Guangzhou", "Shenzhen", "Dongguan", "Zhuhai"],
      Zhejiang: ["Hangzhou", "Ningbo", "Wenzhou"],
      Sichuan: ["Chengdu", "Mianyang"]
    },
    streets: ["Nanjing Road", "Huaihai Road", "Wangfujing St", "Shennan Ave", "Renmin Road"],
    streetFormats: ["No. {num} {street}", "No. {num} {street}, Room {apt}"],
    postcodes: ["100000", "200000", "518000", "310000", "610000"],
    phonePrefix: "+86",
    phoneFormat: "139 {4} {4}",
    ssnFormat: "{6} {4} {2} {2} {4}", // Resident ID Card
    companyNames: ["Tencent Holdings", "Alibaba Systems", "Xiaomi Corp", "Baidu Brain", "Huawei Technologies"],
    jobs: ["AI Algorithm Engineer", "Hardware Specialist", "WeChat Mini-Program Developer", "Cloud Architect", "Product Specialist"],
    firstNames: ["Wei", "Hao", "Yu", "Feng", "Lei", "Jin", "Jie", "Bo", "Jun", "Yi", "Ming", "Li", "Fang", "Xiu", "Ying", "Hua", "Lan", "Mei", "Ping", "Ting", "Qian"],
    lastNames: ["Wang", "Li", "Zhang", "Liu", "Chen", "Yang", "Huang", "Zhao", "Wu", "Zhou", "Xu", "Sun", "Ma", "Zhu", "Hu"]
  },
  AE: {
    name: "United Arab Emirates",
    code: "AE",
    states: ["Dubai", "Abu Dhabi", "Sharjah", "Ajman"],
    cities: {
      Dubai: ["Deira", "Jumeirah", "Downtown Dubai", "Marina"],
      "Abu Dhabi": ["Al Khalidiyah", "Yas Island", "Al Reem Island"],
      Sharjah: ["Al Majaz", "Al Nahda"],
      Ajman: ["Al Rawda", "Al Bustan"]
    },
    streets: ["Sheikh Zayed Road", "Jumeirah Beach Road", "Marina Blvd", "Al Maktoum Road", "Corniche Road"],
    streetFormats: ["{num} {street}", "Apt {apt}, {num} {street}"],
    postcodes: ["00000", "12121", "23232", "34343"],
    phonePrefix: "+971",
    phoneFormat: "50 {3} {4}",
    ssnFormat: "784-{4}-{7}-{1}", // Emirates ID
    companyNames: ["Emaar Properties Digital", "Etisalat Core", "DP World Systems", "Emirates Group Tech", "ADCB Financials"],
    jobs: ["FinTech Solutions Architect", "Cyber Incident Responder", "Infrastructure Engineer", "Service Delivery Lead", "iOS Developer"],
    firstNames: ["Zayed", "Hamdan", "Mohammed", "Saeed", "Rashid", "Sultan", "Khalifa", "Ahmed", "Fatma", "Maryam", "Shaikha", "Latifa", "Reem", "Sara", "Meera", "Hind", "Aisha"],
    lastNames: ["Al Maktoum", "Al Nahyan", "Al Qasimi", "Al Shamsi", "Al Blooshi", "Al Hammadi", "Al Mansoori", "Al Ali", "Al Suwaidi", "Al Mazrouei", "Al Ketbi"]
  },
  ES: {
    name: "Spain",
    code: "ES",
    states: ["Madrid", "Catalonia", "Andalusia", "Valencia"],
    cities: {
      Madrid: ["Madrid", "Alcalá de Henares", "Móstoles"],
      Catalonia: ["Barcelona", "L'Hospitalet de Llobregat", "Badalona"],
      Andalusia: ["Sevilla", "Málaga", "Granada", "Córdoba"],
      Valencia: ["Valencia", "Alicante", "Elche"]
    },
    streets: ["Gran Vía", "Calle de Alcalá", "Passeig de Gràcia", "La Rambla", "Calle Sierpes", "Avenida de la Constitución"],
    streetFormats: ["{street} {num}", "{street} {num}, Piso {apt}"],
    postcodes: ["28001", "08001", "41001", "46001", "29001"],
    phonePrefix: "+34",
    phoneFormat: "6{2} {3} {3}",
    ssnFormat: "[T/X/Y]-{7}-[A-Z]", // NIE / DNI Number
    companyNames: ["Telefónica Digital", "Inditex Tech", "Banco Santander Labs", "Iberdrola Systems", "Amadeus IT Group"],
    jobs: ["Senior Web Engineer", "Data Analyst", "Security Officer", "Agile Consultant", "Network Administrator"],
    firstNames: ["Hugo", "Lucas", "Martín", "Daniel", "Alejandro", "Mateo", "Leo", "Álvaro", "Sofia", "Lucia", "Maria", "Martina", "Paula", "Julia", "Valeria", "Alba", "Manuel", "José"],
    lastNames: ["García", "Rodríguez", "González", "Fernández", "López", "Martínez", "Sánchez", "Pérez", "Gómez", "Martín", "Ruiz", "Hernández", "Díaz", "Alvarez", "Moreno"]
  }
};

// Procedural identity builder
export function generateFakeAddress(countryCode: string): FakeAddress {
  const code = (countryCode || "US").toUpperCase();
  const data = COUNTRY_DATA[code] || COUNTRY_DATA.US;
  
  // Random state & city
  const state = data.states[Math.floor(Math.random() * data.states.length)];
  const cityList = data.cities[state] || [state];
  const city = cityList[Math.floor(Math.random() * cityList.length)];

  // Random street & format
  const street = data.streets[Math.floor(Math.random() * data.streets.length)];
  const format = data.streetFormats[Math.floor(Math.random() * data.streetFormats.length)];
  const num = Math.floor(Math.random() * 899) + 100;
  const apt = Math.floor(Math.random() * 89) + 10;
  const streetAddress = format
    .replace("{num}", num.toString())
    .replace("{street}", street)
    .replace("{apt}", apt.toString());

  // Random postcode
  const zip = data.postcodes[Math.floor(Math.random() * data.postcodes.length)];

  // Gender & Names
  const gender = Math.random() > 0.5 ? "Male" : "Female";
  const firstNames = data.firstNames || FIRST_NAMES;
  const lastNames = data.lastNames || LAST_NAMES;
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];

  // Phone generator
  let phone = data.phoneFormat;
  while (phone.includes("{3}")) phone = phone.replace("{3}", Math.floor(Math.random() * 900 + 100).toString());
  while (phone.includes("{4}")) phone = phone.replace("{4}", Math.floor(Math.random() * 9000 + 1000).toString());
  while (phone.includes("{2}")) phone = phone.replace("{2}", Math.floor(Math.random() * 90 + 10).toString());
  while (phone.includes("{5}")) phone = phone.replace("{5}", Math.floor(Math.random() * 90000 + 10000).toString());
  const finalPhone = `${data.phonePrefix} ${phone}`;

  // SSN / National Identity format generator
  let ssn = data.ssnFormat;
  while (ssn.includes("{3}")) ssn = ssn.replace("{3}", Math.floor(Math.random() * 900 + 100).toString());
  while (ssn.includes("{2}")) ssn = ssn.replace("{2}", Math.floor(Math.random() * 90 + 10).toString());
  while (ssn.includes("{4}")) ssn = ssn.replace("{4}", Math.floor(Math.random() * 9000 + 1000).toString());
  while (ssn.includes("{6}")) ssn = ssn.replace("{6}", Math.floor(Math.random() * 900000 + 100000).toString());
  while (ssn.includes("{1}")) ssn = ssn.replace("{1}", Math.floor(Math.random() * 9 + 1).toString());
  if (ssn.includes("[A-D]")) {
    const chars = ["A", "B", "C", "D"];
    ssn = ssn.replace("[A-D]", chars[Math.floor(Math.random() * chars.length)]);
  }
  if (ssn.includes("[A-Z]")) {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    ssn = ssn.replace("[A-Z]", chars[Math.floor(Math.random() * chars.length)]);
  }

  // DOB
  const birthYear = Math.floor(Math.random() * 40) + 1965; // age 21 to 61
  const birthMonth = Math.floor(Math.random() * 12) + 1;
  const birthDay = Math.floor(Math.random() * 28) + 1;
  const dob = `${birthYear}-${birthMonth < 10 ? `0${birthMonth}` : birthMonth}-${birthDay < 10 ? `0${birthDay}` : birthDay}`;

  // Username/Password
  const username = `${firstName.toLowerCase()}${lastName.toLowerCase()}${Math.floor(Math.random() * 90 + 10)}`;
  const password = Math.random().toString(36).substring(2, 10) + "@" + Math.floor(Math.random() * 900 + 100);

  // Profile avatar using standard UI initials avatar
  const avatar = `https://api.dicebear.com/7.x/initials/svg?seed=${firstName}%20${lastName}&backgroundColor=7c3aed`;

  const company = data.companyNames[Math.floor(Math.random() * data.companyNames.length)];
  const jobTitle = data.jobs[Math.floor(Math.random() * data.jobs.length)];

  return {
    id: Math.random().toString(36).substring(2, 11),
    gender,
    firstName,
    lastName,
    street: streetAddress,
    city,
    state,
    zip,
    country: data.name,
    countryCode: code,
    phone: finalPhone,
    ssn,
    dob,
    username,
    password,
    company,
    jobTitle,
    avatar
  };
}
