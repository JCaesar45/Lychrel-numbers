function isLychrel(n) {
  const ITERATIONS = 500;
  
  // Helper function to reverse a number (as string to handle big numbers)
  function reverseNumber(numStr) {
    return numStr.split('').reverse().join('');
  }
  
  // Helper function to add two numbers represented as strings
  function addStrings(a, b) {
    let result = '';
    let carry = 0;
    let i = a.length - 1;
    let j = b.length - 1;
    
    while (i >= 0 || j >= 0 || carry > 0) {
      const digitA = i >= 0 ? parseInt(a[i]) : 0;
      const digitB = j >= 0 ? parseInt(b[j]) : 0;
      const sum = digitA + digitB + carry;
      
      result = (sum % 10) + result;
      carry = Math.floor(sum / 10);
      
      i--;
      j--;
    }
    
    return result;
  }
  
  // Helper function to check if a string is a palindrome
  function isPalindrome(str) {
    let left = 0;
    let right = str.length - 1;
    
    while (left < right) {
      if (str[left] !== str[right]) {
        return false;
      }
      left++;
      right--;
    }
    return true;
  }
  
  // Start with the number as a string
  let current = n.toString();
  
  // Perform up to 500 iterations
  for (let i = 0; i < ITERATIONS; i++) {
    const reversed = reverseNumber(current);
    current = addStrings(current, reversed);
    
    if (isPalindrome(current)) {
      return false; // Found a palindrome, so not a Lychrel number
    }
  }
  
  // After 500 iterations without finding a palindrome, it's a Lychrel number
  return true;
}
