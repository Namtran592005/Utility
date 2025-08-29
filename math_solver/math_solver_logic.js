document.addEventListener("DOMContentLoaded", () => {
  // --- CẤU TRÚC DỮ LIỆU CÁC BÀI TOÁN (PHIÊN BẢN MỞ RỘNG TỐI ĐA) ---
  // Shorthand keys: l: label, t: type, p: placeholder, d: default
  const PROBLEM_CATEGORIES = {
    arithmetic: {
      name: "Số học",
      problems: {
        "basic-ops": {
          name: "Các phép toán cơ bản",
          inputs: [
            {
              id: "expr",
              l: "Biểu thức",
              t: "text",
              p: "Ví dụ: (5 + 3) * 2 - 10 / 2",
            },
          ],
          solver: (i) => ({
            result: math.evaluate(i.expr),
            steps: [`Kết quả của ${i.expr} là:`],
          }),
        },
        "fraction-ops": {
          name: "Phép toán Phân số",
          inputs: [
            { id: "frac1", l: "Phân số 1", t: "text", p: "1/2" },
            {
              id: "op",
              l: "Phép toán",
              t: "select",
              options: ["+", "-", "*", "/"],
            },
            { id: "frac2", l: "Phân số 2", t: "text", p: "3/4" },
          ],
          solver: (i) => {
            const f1 = math.fraction(i.frac1);
            const f2 = math.fraction(i.frac2);
            const ops = {
              "+": math.add,
              "-": math.subtract,
              "*": math.multiply,
              "/": math.divide,
            };
            const result = ops[i.op](f1, f2);
            return {
              result: result.toFraction(true),
              steps: [
                `${i.frac1} ${i.op} ${i.frac2} = ${result.toFraction(true)}`,
              ],
            };
          },
        },
        "prime-factors": {
          name: "Phân tích Thừa số nguyên tố",
          inputs: [{ id: "num", l: "Số tự nhiên", t: "number", p: "90" }],
          solver: (i) => {
            let n = parseInt(i.num);
            if (isNaN(n) || n < 2)
              throw new Error("Vui lòng nhập số tự nhiên lớn hơn 1.");
            let factors = [];
            for (let j = 2; j * j <= n; j++) {
              while (n % j === 0) {
                factors.push(j);
                n /= j;
              }
            }
            if (n > 1) factors.push(n);
            return {
              result: factors.join(" × "),
              steps: [`${i.num} = ${factors.join(" × ")}`],
            };
          },
        },
        "gcd-lcm": {
          name: "ƯCLN & BCNN",
          inputs: [
            {
              id: "nums",
              l: "Các số (cách nhau bởi dấu phẩy)",
              t: "text",
              p: "48, 18, 24",
            },
          ],
          solver: (i) => {
            const arr = i.nums.split(",").map((n) => parseInt(n.trim()));
            if (arr.some(isNaN)) throw new Error("Vui lòng nhập số hợp lệ.");
            return {
              result: `ƯCLN: ${math.gcd(...arr)}, BCNN: ${math.lcm(...arr)}`,
              steps: [],
            };
          },
        },
        "check-prime": {
          name: "Kiểm tra số nguyên tố",
          inputs: [{ id: "num", l: "Số tự nhiên", t: "number", p: "29" }],
          solver: (i) => {
            const n = parseInt(i.num);
            const isPrime = math.isPrime(n);
            return {
              result: isPrime
                ? `${n} là số nguyên tố.`
                : `${n} không phải là số nguyên tố.`,
              steps: [],
            };
          },
        },
        "number-base-conversion": {
          name: "Chuyển đổi hệ cơ số",
          inputs: [
            { id: "num", l: "Số", t: "text", d: "100" },
            { id: "base_from", l: "Từ hệ cơ số", t: "number", d: "10" },
            { id: "base_to", l: "Sang hệ cơ số", t: "number", d: "2" },
          ],
          solver: (i) => {
            const result = parseInt(i.num, parseInt(i.base_from))
              .toString(parseInt(i.base_to))
              .toUpperCase();
            return {
              result: result,
              steps: [
                `(${i.num}) base ${i.base_from} = (${result}) base ${i.base_to}`,
              ],
            };
          },
        },
        "roman-numerals": {
          name: "Chuyển đổi số La Mã",
          inputs: [
            { id: "num", l: "Số (1-3999) hoặc số La Mã", t: "text", d: "2024" },
          ],
          solver: (i) => {
            const num = i.num;
            if (!isNaN(parseInt(num))) {
              // Number to Roman
              let val = parseInt(num);
              if (val < 1 || val > 3999)
                throw new Error("Số phải từ 1 đến 3999.");
              const roman = {
                M: 1000,
                CM: 900,
                D: 500,
                CD: 400,
                C: 100,
                XC: 90,
                L: 50,
                XL: 40,
                X: 10,
                IX: 9,
                V: 5,
                IV: 4,
                I: 1,
              };
              let result = "";
              for (let k in roman) {
                while (val >= roman[k]) {
                  result += k;
                  val -= roman[k];
                }
              }
              return { result: result, steps: [] };
            } else {
              // Roman to Number
              const roman = {
                I: 1,
                V: 5,
                X: 10,
                L: 50,
                C: 100,
                D: 500,
                M: 1000,
              };
              let result = 0;
              for (let k = 0; k < num.length; k++) {
                if (roman[num[k]] < roman[num[k + 1]]) result -= roman[num[k]];
                else result += roman[num[k]];
              }
              return { result: result, steps: [] };
            }
          },
        },
      },
    },
    algebra: {
      name: "Đại số",
      problems: {
        "linear-system": {
          name: "Giải hệ PT tuyến tính 2 ẩn",
          inputs: [
            { id: "a1", l: "Hệ số a1", t: "number", d: "2" },
            { id: "b1", l: "Hệ số b1", t: "number", d: "3" },
            { id: "c1", l: "Hệ số c1", t: "number", d: "7" },
            { id: "a2", l: "Hệ số a2", t: "number", d: "1" },
            { id: "b2", l: "Hệ số b2", t: "number", d: "-1" },
            { id: "c2", l: "Hệ số c2", t: "number", d: "1" },
          ],
          solver: (i) => {
            const [a1, b1, c1, a2, b2, c2] = [
              i.a1,
              i.b1,
              i.c1,
              i.a2,
              i.b2,
              i.c2,
            ].map(parseFloat);
            const A = [
              [a1, b1],
              [a2, b2],
            ];
            const b = [c1, c2];
            try {
              const sol = math.lusolve(A, b);
              const x = sol._data[0][0];
              const y = sol._data[1][0];
              return {
                result: `x = ${x.toFixed(4)}, y = ${y.toFixed(4)}`,
                steps: [
                  `Hệ phương trình:`,
                  `<code>${a1}x + ${b1}y = ${c1}</code>`,
                  `<code>${a2}x + ${b2}y = ${c2}</code>`,
                ],
              };
            } catch (e) {
              throw new Error("Hệ phương trình vô nghiệm hoặc vô số nghiệm.");
            }
          },
        },
        "quadratic-equation": {
          name: "Giải phương trình bậc 2 (ax²+bx+c=0)",
          inputs: [
            { id: "a", l: "Hệ số a", t: "number", d: "1" },
            { id: "b", l: "Hệ số b", t: "number", d: "-3" },
            { id: "c", l: "Hệ số c", t: "number", d: "2" },
          ],
          solver: (i) => {
            const a = parseFloat(i.a),
              b = parseFloat(i.b),
              c = parseFloat(i.c);
            if ([a, b, c].some(isNaN)) throw new Error("Hệ số không hợp lệ.");
            let s = [`<code>${a}x² + ${b}x + ${c} = 0</code>`];
            if (a === 0) {
              s.push("Đây là PT bậc nhất.");
              if (b === 0)
                return {
                  result: c === 0 ? "Vô số nghiệm" : "Vô nghiệm",
                  steps: s,
                };
              const x = -c / b;
              s.push(`x = -c/a = ${x}`);
              return { result: `x = ${x}`, steps: s };
            }
            const d = b * b - 4 * a * c;
            s.push(`Δ = b²-4ac = ${d}`);
            if (d < 0) return { result: "Vô nghiệm thực", steps: s };
            if (d === 0) {
              const x = -b / (2 * a);
              s.push(`Nghiệm kép x = -b/2a = ${x}`);
              return { result: `x = ${x}`, steps: s };
            }
            const sd = Math.sqrt(d),
              x1 = (-b + sd) / (2 * a),
              x2 = (-b - sd) / (2 * a);
            s.push(
              `x1=(-b+√Δ)/2a ≈ ${x1.toFixed(4)}`,
              `x2=(-b-√Δ)/2a ≈ ${x2.toFixed(4)}`
            );
            return {
              result: `x1≈${x1.toFixed(4)}, x2≈${x2.toFixed(4)}`,
              steps: s,
            };
          },
        },
        "simplify-expr": {
          name: "Rút gọn biểu thức",
          inputs: [
            {
              id: "expr",
              l: "Biểu thức",
              t: "text",
              p: "(x^2 + 2x + 1) / (x + 1)",
            },
          ],
          solver: (i) => ({
            result: `<code>${math.simplify(i.expr).toString()}</code>`,
            steps: [`Rút gọn của: <code>${i.expr}</code>`],
          }),
        },
        logarithm: {
          name: "Tính Logarit",
          inputs: [
            { id: "base", l: "Cơ số (b)", t: "number", d: "10" },
            { id: "arg", l: "Đối số (x)", t: "number", d: "100" },
          ],
          solver: (i) => {
            const b = parseFloat(i.base),
              x = parseFloat(i.arg);
            const result = math.log(x, b);
            return {
              result: result.toFixed(5),
              steps: [`log<sub>${b}</sub>(${x})`],
            };
          },
        },
        "arithmetic-progression": {
          name: "Tính cấp số cộng",
          inputs: [
            { id: "a1", l: "Số hạng đầu (a1)", t: "number", d: "2" },
            { id: "d", l: "Công sai (d)", t: "number", d: "3" },
            { id: "n", l: "Số hạng thứ (n)", t: "number", d: "10" },
          ],
          solver: (i) => {
            const a1 = parseFloat(i.a1),
              d = parseFloat(i.d),
              n = parseInt(i.n);
            const an = a1 + (n - 1) * d;
            const sn = (n / 2) * (2 * a1 + (n - 1) * d);
            return {
              result: `Số hạng thứ ${n} là ${an}`,
              steps: [`Tổng ${n} số hạng đầu là ${sn}`],
            };
          },
        },
        "geometric-progression": {
          name: "Tính cấp số nhân",
          inputs: [
            { id: "a1", l: "Số hạng đầu (a1)", t: "number", d: "2" },
            { id: "q", l: "Công bội (q)", t: "number", d: "3" },
            { id: "n", l: "Số hạng thứ (n)", t: "number", d: "5" },
          ],
          solver: (i) => {
            const a1 = parseFloat(i.a1),
              q = parseFloat(i.q),
              n = parseInt(i.n);
            const an = a1 * Math.pow(q, n - 1);
            const sn = (a1 * (Math.pow(q, n) - 1)) / (q - 1);
            return {
              result: `Số hạng thứ ${n} là ${an}`,
              steps: [`Tổng ${n} số hạng đầu là ${sn.toFixed(3)}`],
            };
          },
        },
      },
    },
    geometry: {
      name: "Hình học",
      problems: {
        "distance-2d": {
          name: "Khoảng cách 2 điểm (2D)",
          inputs: [
            { id: "x1", l: "x1", t: "number", d: "1" },
            { id: "y1", l: "y1", t: "number", d: "2" },
            { id: "x2", l: "x2", t: "number", d: "4" },
            { id: "y2", l: "y2", t: "number", d: "6" },
          ],
          solver: (i) => {
            const [x1, y1, x2, y2] = [i.x1, i.y1, i.x2, i.y2].map(parseFloat);
            const d = math.distance([x1, y1], [x2, y2]);
            return {
              result: d.toFixed(4),
              steps: [
                `d = √((x2-x1)² + (y2-y1)²)`,
                `d = √((4-1)² + (6-2)²) = 5`,
              ],
            };
          },
        },
        "midpoint-2d": {
          name: "Trung điểm đoạn thẳng (2D)",
          inputs: [
            { id: "x1", l: "x1", t: "number", d: "1" },
            { id: "y1", l: "y1", t: "number", d: "2" },
            { id: "x2", l: "x2", t: "number", d: "5" },
            { id: "y2", l: "y2", t: "number", d: "8" },
          ],
          solver: (i) => {
            const [x1, y1, x2, y2] = [i.x1, i.y1, i.x2, i.y2].map(parseFloat);
            const mx = (x1 + x2) / 2;
            const my = (y1 + y2) / 2;
            return {
              result: `M(${mx}, ${my})`,
              steps: [`M = ((x1+x2)/2, (y1+y2)/2)`],
            };
          },
        },
        "right-triangle": {
          name: "Tam giác vuông (Pytago)",
          inputs: [
            { id: "a", l: "Cạnh kề a", t: "number", d: "3" },
            { id: "b", l: "Cạnh kề b", t: "number", d: "4" },
          ],
          solver: (i) => {
            const a = parseFloat(i.a),
              b = parseFloat(i.b);
            const c = math.sqrt(a * a + b * b);
            const area = (a * b) / 2;
            return {
              result: `Cạnh huyền c = ${c.toFixed(3)}`,
              steps: [
                `Diện tích = ${area}`,
                `Định lý Pytago: c = √(a² + b²)`,
                `Diện tích = (a * b) / 2`,
              ],
            };
          },
        },
        "triangle-area-heron": {
          name: "Diện tích tam giác (Heron)",
          inputs: [
            { id: "s1", l: "Cạnh a", t: "number", d: "3" },
            { id: "s2", l: "Cạnh b", t: "number", d: "4" },
            { id: "s3", l: "Cạnh c", t: "number", d: "5" },
          ],
          solver: (i) => {
            const a = parseFloat(i.s1),
              b = parseFloat(i.s2),
              c = parseFloat(i.s3);
            const s = (a + b + c) / 2;
            const area = Math.sqrt(s * (s - a) * (s - b) * (s - c));
            if (isNaN(area))
              throw new Error("Ba cạnh không tạo thành tam giác.");
            return {
              result: `Diện tích = ${area.toFixed(3)}`,
              steps: [`Nửa chu vi p = ${s}`, `S = √p(p-a)(p-b)(p-c)`],
            };
          },
        },
        circle: {
          name: "Hình tròn",
          inputs: [{ id: "r", l: "Bán kính (r)", t: "number", d: "5" }],
          solver: (i) => {
            const r = parseFloat(i.r);
            if (isNaN(r) || r < 0) throw new Error("Bán kính phải dương.");
            const a = Math.PI * r * r,
              c = 2 * Math.PI * r;
            return {
              result: `Diện tích: ${a.toFixed(3)}`,
              steps: [`Chu vi: ${c.toFixed(3)}`, `S = πr²`, `C = 2πr`],
            };
          },
        },
        cube: {
          name: "Hình lập phương",
          inputs: [{ id: "side", l: "Cạnh", t: "number", d: "4" }],
          solver: (i) => {
            const s = parseFloat(i.side);
            const v = s * s * s,
              sa = 6 * s * s;
            return {
              result: `Thể tích = ${v}`,
              steps: [`Diện tích toàn phần = ${sa}`, `V = a³`, `S_tp = 6a²`],
            };
          },
        },
        sphere: {
          name: "Hình cầu",
          inputs: [{ id: "r", l: "Bán kính", t: "number", d: "3" }],
          solver: (i) => {
            const r = parseFloat(i.r);
            const v = (4 / 3) * Math.PI * r * r * r,
              sa = 4 * Math.PI * r * r;
            return {
              result: `Thể tích = ${v.toFixed(3)}`,
              steps: [
                `Diện tích bề mặt = ${sa.toFixed(3)}`,
                `V = (4/3)πr³`,
                `S = 4πr²`,
              ],
            };
          },
        },
        cylinder: {
          name: "Hình trụ",
          inputs: [
            { id: "r", l: "Bán kính đáy", t: "number", d: "3" },
            { id: "h", l: "Chiều cao", t: "number", d: "10" },
          ],
          solver: (i) => {
            const r = parseFloat(i.r),
              h = parseFloat(i.h);
            const v = Math.PI * r * r * h,
              sa = 2 * Math.PI * r * (r + h);
            return {
              result: `Thể tích = ${v.toFixed(3)}`,
              steps: [
                `Diện tích toàn phần = ${sa.toFixed(3)}`,
                `V = πr²h`,
                `S_tp = 2πr(r+h)`,
              ],
            };
          },
        },
        cone: {
          name: "Hình nón",
          inputs: [
            { id: "r", l: "Bán kính đáy", t: "number", d: "3" },
            { id: "h", l: "Chiều cao", t: "number", d: "4" },
          ],
          solver: (i) => {
            const r = parseFloat(i.r),
              h = parseFloat(i.h);
            const l = math.sqrt(r * r + h * h);
            const v = (1 / 3) * Math.PI * r * r * h,
              sa = Math.PI * r * (r + l);
            return {
              result: `Thể tích = ${v.toFixed(3)}`,
              steps: [
                `Đường sinh l = ${l.toFixed(3)}`,
                `Diện tích toàn phần = ${sa.toFixed(3)}`,
              ],
            };
          },
        },
      },
    },
    trigonometry: {
      name: "Lượng giác",
      problems: {
        "basic-trig": {
          name: "Tính sin, cos, tan",
          inputs: [{ id: "angle", l: "Góc (độ)", t: "number", d: "30" }],
          solver: (i) => {
            const a = parseFloat(i.angle),
              r = math.unit(a, "deg").to("rad").value;
            const s = math.sin(r),
              c = math.cos(r),
              t = math.tan(r);
            return {
              result: `sin(${a}°) ≈ ${s.toFixed(4)}`,
              steps: [
                `cos(${a}°) ≈ ${c.toFixed(4)}`,
                `tan(${a}°) ≈ ${t.toFixed(4)}`,
              ],
            };
          },
        },
        "inverse-trig": {
          name: "Tính arcsin, arccos, arctan",
          inputs: [
            { id: "val", l: "Giá trị (-1 đến 1)", t: "number", d: "0.5" },
          ],
          solver: (i) => {
            const v = parseFloat(i.val);
            const asin = math.asin(v),
              acos = math.acos(v),
              atan = math.atan(v);
            return {
              result: `arcsin(${v}) ≈ ${math
                .unit(asin, "rad")
                .to("deg")
                .toNumber()
                .toFixed(2)}°`,
              steps: [
                `arccos(${v}) ≈ ${math
                  .unit(acos, "rad")
                  .to("deg")
                  .toNumber()
                  .toFixed(2)}°`,
                `arctan(x) không bị giới hạn trong [-1,1]`,
              ],
            };
          },
        },
        "law-of-sines": {
          name: "Định lý Sin",
          inputs: [
            { id: "A", l: "Góc A (độ)", t: "number", d: "30" },
            { id: "a", l: "Cạnh a (đối diện A)", t: "number", d: "5" },
            { id: "B", l: "Góc B (độ)", t: "number", d: "45" },
          ],
          solver: (i) => {
            const A = math.unit(i.A, "deg").to("rad").value,
              a = parseFloat(i.a),
              B = math.unit(i.B, "deg").to("rad").value;
            const b = (a * math.sin(B)) / math.sin(A);
            return {
              result: `Cạnh b ≈ ${b.toFixed(3)}`,
              steps: [`Tìm cạnh b đối diện góc B`, `b = (a * sin(B)) / sin(A)`],
            };
          },
        },
        "law-of-cosines": {
          name: "Định lý Cos",
          inputs: [
            { id: "a", l: "Cạnh a", t: "number", d: "8" },
            { id: "b", l: "Cạnh b", t: "number", d: "10" },
            { id: "C", l: "Góc C (độ) xen giữa", t: "number", d: "60" },
          ],
          solver: (i) => {
            const a = parseFloat(i.a),
              b = parseFloat(i.b),
              C = math.unit(i.C, "deg").to("rad").value;
            const c2 = a * a + b * b - 2 * a * b * math.cos(C);
            return {
              result: `Cạnh c ≈ ${math.sqrt(c2).toFixed(3)}`,
              steps: [`Tìm cạnh c đối diện góc C`, `c² = a² + b² - 2ab*cos(C)`],
            };
          },
        },
      },
    },
    calculus: {
      name: "Giải tích",
      problems: {
        derivative: {
          name: "Tính đạo hàm",
          inputs: [
            { id: "func", l: "Hàm số f(x)", t: "text", p: "x^3 + sin(x)" },
            { id: "var", l: "Theo biến", t: "text", d: "x" },
          ],
          solver: (i) => ({
            result: `<code>${math.derivative(i.func, i.var).toString()}</code>`,
            steps: [`Đạo hàm của f(x) = <code>${i.func}</code>`],
          }),
        },
        integral: {
          name: "Tích phân xác định",
          inputs: [
            { id: "func", l: "Hàm số f(x)", t: "text", p: "x^2" },
            { id: "lower", l: "Cận dưới", t: "number", d: "0" },
            { id: "upper", l: "Cận trên", t: "number", d: "1" },
          ],
          solver: (i) => {
            const result = math.integral(i.func, "x", i.lower, i.upper);
            return {
              result: result.toFixed(5),
              steps: [
                `Tính tích phân của <code>${i.func}</code> từ ${i.lower} đến ${i.upper}`,
              ],
            };
          },
        },
        "tangent-line": {
          name: "Phương trình tiếp tuyến",
          inputs: [
            { id: "func", l: "Hàm số f(x)", t: "text", p: "x^2" },
            { id: "point", l: "Tại điểm x =", t: "number", d: "2" },
          ],
          solver: (i) => {
            const p = parseFloat(i.point);
            const f_prime = math.derivative(i.func, "x");
            const slope = f_prime.evaluate({ x: p });
            const y0 = math.parse(i.func).evaluate({ x: p });
            const intercept = y0 - slope * p;
            return {
              result: `<code>y = ${slope}x + ${intercept}</code>`,
              steps: [
                `f'(${p}) (hệ số góc) = ${slope}`,
                `f(${p}) = ${y0}`,
                `y - y0 = f'(x0)(x-x0)`,
              ],
            };
          },
        },
      },
    },
    matrices: {
      name: "Ma trận",
      problems: {
        "matrix-add-sub": {
          name: "Cộng / Trừ 2 Ma trận",
          inputs: [
            { id: "A", l: "Ma trận A", t: "textarea", p: "[[1,2],[3,4]]" },
            { id: "op", t: "select", options: ["+", "-"] },
            { id: "B", l: "Ma trận B", t: "textarea", p: "[[5,6],[7,8]]" },
          ],
          solver: (i) => {
            const A = math.matrix(JSON.parse(i.A)),
              B = math.matrix(JSON.parse(i.B));
            const op = i.op === "+" ? math.add : math.subtract;
            const C = op(A, B);
            return { result: `<pre>${C.toString()}</pre>`, steps: [] };
          },
        },
        "matrix-multiply": {
          name: "Nhân 2 Ma trận",
          inputs: [
            { id: "A", l: "Ma trận A", t: "textarea", p: "[[1,2],[3,4]]" },
            { id: "B", l: "Ma trận B", t: "textarea", p: "[[5,6],[7,8]]" },
          ],
          solver: (i) => {
            const A = math.matrix(JSON.parse(i.A)),
              B = math.matrix(JSON.parse(i.B));
            const C = math.multiply(A, B);
            return { result: `<pre>${C.toString()}</pre>`, steps: [] };
          },
        },
        "matrix-props": {
          name: "Tính chất Ma trận vuông",
          inputs: [
            {
              id: "matrix",
              l: "Ma trận (định dạng [[a,b],[c,d]])",
              t: "textarea",
              p: "[[1, -2], [3, 4]]",
            },
          ],
          solver: (i) => {
            const m = math.matrix(JSON.parse(i.matrix.replace(/\s/g, "")));
            const size = m.size();
            if (size.length !== 2 || size[0] !== size[1])
              throw new Error("Ma trận phải là ma trận vuông.");
            const det = math.det(m);
            const trace = math.trace(m);
            const trans = math.transpose(m);
            const formatMatrix = (mat) =>
              mat.toString().replace(/\[/g, " [").replace(/],/g, "]\n");
            let steps = [
              `Vết (trace) = ${trace}`,
              `Chuyển vị:\n<pre>${formatMatrix(trans)}</pre>`,
            ];
            try {
              const inv = math.inv(m);
              steps.unshift(`Nghịch đảo:\n<pre>${formatMatrix(inv)}</pre>`);
            } catch (e) {
              steps.unshift("Ma trận không khả nghịch.");
            }
            return { result: `Định thức (det) = ${det}`, steps: steps };
          },
        },
      },
    },
    statistics: {
      name: "Thống kê",
      problems: {
        descriptive: {
          name: "Thống kê mô tả",
          inputs: [
            {
              id: "data",
              l: "Dữ liệu (cách nhau bởi dấu phẩy)",
              t: "textarea",
              p: "1, 5, 2, 8, 7, 9, 2, 5, 15, -3",
            },
          ],
          solver: (i) => {
            const arr = i.data.split(",").map((n) => parseFloat(n.trim()));
            if (arr.some(isNaN)) throw new Error("Dữ liệu không hợp lệ.");
            const stats = {
              "Số phần tử": arr.length,
              "Trung bình (Mean)": math.mean(arr).toFixed(3),
              "Trung vị (Median)": math.median(arr).toFixed(3),
              "Yếu vị (Mode)": math.mode(arr).join(", "),
              "Độ lệch chuẩn (StdDev)": math.std(arr).toFixed(3),
              "Phương sai (Variance)": math.variance(arr).toFixed(3),
              "Tổng (Sum)": math.sum(arr),
              Min: math.min(arr),
              Max: math.max(arr),
            };
            let table = "<table>";
            for (const key in stats) {
              table += `<tr><td>${key}</td><td>${stats[key]}</td></tr>`;
            }
            table += "</table>";
            return {
              result: `Trung bình = ${stats["Trung bình (Mean)"]}`,
              steps: [table],
            };
          },
        },
        "combinations-permutations": {
          name: "Tổ hợp & Chỉnh hợp",
          inputs: [
            { id: "n", l: "Tổng số phần tử (n)", t: "number", d: "10" },
            { id: "k", l: "Số phần tử chọn (k)", t: "number", d: "3" },
          ],
          solver: (i) => {
            const n = parseInt(i.n),
              k = parseInt(i.k);
            const p = math.permutations(n, k),
              c = math.combinations(n, k);
            return {
              result: `Chỉnh hợp P(${n},${k}) = ${p.toLocaleString()}`,
              steps: [`Tổ hợp C(${n},${k}) = ${c.toLocaleString()}`],
            };
          },
        },
        factorial: {
          name: "Tính Giai thừa",
          inputs: [{ id: "n", l: "Số tự nhiên (n)", t: "number", d: "10" }],
          solver: (i) => {
            const n = parseInt(i.n);
            return {
              result: math.factorial(n).toLocaleString(),
              steps: [`${n}!`],
            };
          },
        },
      },
    },
    evaluator: {
      name: "Máy tính Biểu thức",
      problems: {
        evaluate: {
          name: "Tính giá trị biểu thức",
          inputs: [
            {
              id: "expr",
              l: "Nhập biểu thức bất kỳ",
              t: "textarea",
              p: "(sqrt(5^2 + 12^2) + C(10, 3)) / 2",
            },
          ],
          solver: (i) => ({
            result: `<code>${math.evaluate(i.expr)}</code>`,
            steps: [`Kết quả của <code>${i.expr}</code> là:`],
          }),
        },
      },
    },
  };

  // --- DOM ELEMENTS & LOGIC (GIỮ NGUYÊN TỪ BẢN TRƯỚC) ---
  // Phần code còn lại của file này không cần thay đổi.
  // Nó đã được thiết kế để tự động xử lý cấu trúc dữ liệu khổng lồ ở trên.
  const mathCategoryTabs = document.getElementById("math-category-tabs");
  const mathProblemSelect = document.getElementById("math-problem-select");
  const dynamicInputsContainer = document.getElementById("dynamic-inputs");
  const solveBtn = document.getElementById("solve-btn");
  const solutionOutput = document.getElementById("solution-output");
  const controlsWrapper = document.getElementById("math-controls-wrapper");

  function populateCategories() {
    mathCategoryTabs.innerHTML = "";
    for (const key in PROBLEM_CATEGORIES) {
      const btn = document.createElement("button");
      btn.className = "tab-btn";
      btn.dataset.tab = key;
      btn.textContent = PROBLEM_CATEGORIES[key].name;
      mathCategoryTabs.appendChild(btn);
    }
    mathCategoryTabs.firstChild.classList.add("active");
  }

  function populateProblemSelect(categoryKey) {
    controlsWrapper.style.display =
      categoryKey === "evaluator" ? "none" : "flex";
    mathProblemSelect.innerHTML = "";
    const problems = PROBLEM_CATEGORIES[categoryKey].problems;
    for (const key in problems) {
      mathProblemSelect.innerHTML += `<option value="${key}">${problems[key].name}</option>`;
    }
    mathProblemSelect.dispatchEvent(new Event("change"));
  }

  function createDynamicInputs(problemKey) {
    dynamicInputsContainer.innerHTML = "";
    solutionOutput.innerHTML = "";
    const activeCategoryKey = document.querySelector(
      "#math-category-tabs .tab-btn.active"
    ).dataset.tab;
    const problem = PROBLEM_CATEGORIES[activeCategoryKey]?.problems[problemKey];
    if (!problem) {
      dynamicInputsContainer.innerHTML =
        '<p class="placeholder-text">Chọn loại bài toán.</p>';
      return;
    }
    problem.inputs.forEach((inputDef) => {
      const formGroup = document.createElement("div");
      formGroup.className = "form-group";
      const label = document.createElement("label");
      label.htmlFor = inputDef.id || inputDef.l;
      label.textContent = inputDef.l || inputDef.label;
      formGroup.appendChild(label);

      let el;
      const type = inputDef.t || inputDef.type;

      if (type === "textarea") {
        el = document.createElement("textarea");
        el.rows = 3;
      } else if (type === "select") {
        el = document.createElement("select");
        inputDef.options.forEach((opt) => {
          const option = document.createElement("option");
          option.value = opt;
          option.textContent = opt;
          el.appendChild(option);
        });
      } else {
        el = document.createElement("input");
        el.type = type;
      }

      el.id = inputDef.id || inputDef.l;
      el.placeholder = inputDef.p || inputDef.placeholder || "";
      el.value = inputDef.d || inputDef.default || "";
      el.classList.add("dynamic-input");
      formGroup.appendChild(el);
      dynamicInputsContainer.appendChild(formGroup);
    });
    solveProblem();
  }

  mathCategoryTabs.addEventListener("click", (e) => {
    if (
      e.target.tagName === "BUTTON" &&
      !e.target.classList.contains("active")
    ) {
      document
        .querySelector("#math-category-tabs .tab-btn.active")
        .classList.remove("active");
      e.target.classList.add("active");
      populateProblemSelect(e.target.dataset.tab);
    }
  });

  mathProblemSelect.addEventListener("change", (e) =>
    createDynamicInputs(e.target.value)
  );
  solveBtn.addEventListener("click", solveProblem);
  dynamicInputsContainer.addEventListener("input", debounce(solveProblem, 500));

  function solveProblem() {
    const activeCategoryKey = document.querySelector(
      "#math-category-tabs .tab-btn.active"
    ).dataset.tab;
    const problemKey = mathProblemSelect.value;
    const problem = PROBLEM_CATEGORIES[activeCategoryKey]?.problems[problemKey];
    if (!problem) return;

    const inputs = {};
    let allInputsValid = true;
    dynamicInputsContainer
      .querySelectorAll(".dynamic-input")
      .forEach((input) => {
        inputs[input.id] = input.value;
        if (!input.value.trim()) allInputsValid = false;
      });

    if (!allInputsValid) {
      solutionOutput.innerHTML =
        '<p class="placeholder-text">Vui lòng nhập đủ các giá trị.</p>';
      return;
    }

    try {
      const solution = problem.solver(inputs);
      let stepsHTML = solution.steps.map((step) => `<p>${step}</p>`).join("");
      solutionOutput.innerHTML = `
                <div class="result-text">${solution.result}</div>
                ${
                  stepsHTML
                    ? `<div class="solution-steps">${stepsHTML}</div>`
                    : ""
                }
            `;
    } catch (error) {
      solutionOutput.innerHTML = `<p class="error-message">${error.message}</p>`;
    }
  }

  function debounce(func, delay) {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), delay);
    };
  }

  populateCategories();
  populateProblemSelect(
    document.querySelector("#math-category-tabs .tab-btn.active").dataset.tab
  );
});
