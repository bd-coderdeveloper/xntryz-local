"use strict";

(self.webpackChunk_N_E = self.webpackChunk_N_E || []).push([[1182], {
  39516: function (e, t, r) {
    r.d(t, {
      d: function () {
        return d;
      },
      f: function () {
        return c;
      }
    });
    var n = r(67294);
    var o = r(19946);
    var l = r(12351);
    var a = r(16723);
    var i = r(23784);
    var u = r(73781);
    let s = (0, n.createContext)(null);
    function c() {
      let [e, t] = (0, n.useState)([]);
      return [e.length > 0 ? e.join(" ") : undefined, (0, n.useMemo)(() => function (e) {
        let r = (0, u.z)(e => {
          t(t => [...t, e]);
          return () => t(t => {
            let r = t.slice();
            let n = r.indexOf(e);
            if (n !== -1) {
              r.splice(n, 1);
            }
            return r;
          });
        });
        let o = (0, n.useMemo)(() => ({
          register: r,
          slot: e.slot,
          name: e.name,
          props: e.props
        }), [r, e.slot, e.name, e.props]);
        return n.createElement(s.Provider, {
          value: o
        }, e.children);
      }, [t])];
    }
    let d = (0, l.yV)(function (e, t) {
      let r = function e() {
        let t = (0, n.useContext)(s);
        if (t === null) {
          let t = Error("You used a <Description /> component, but it is not inside a relevant parent.");
          if (Error.captureStackTrace) {
            Error.captureStackTrace(t, e);
          }
          throw t;
        }
        return t;
      }();
      let u = `headlessui-description-${(0, o.M)()}`;
      let c = (0, i.T)(t);
      (0, a.e)(() => r.register(u), [u, r.register]);
      let d = {
        ref: c,
        ...r.props,
        id: u
      };
      return (0, l.sY)({
        ourProps: d,
        theirProps: e,
        slot: r.slot || {},
        defaultTag: "p",
        name: r.name || "Description"
      });
    });
  },
  88131: function (e, t, r) {
    r.d(t, {
      V: function () {
        return eo;
      }
    });
    var n;
    var o;
    var l;
    var a;
    var i;
    var u = r(67294);
    var s = r(32984);
    var c = r(12351);
    var d = r(23784);
    var f = r(61363);
    var p = r(64103);
    var v = r(19946);
    var h = r(82180);
    var m = r(46045);
    var g = r(84575);
    var w = r(73781);
    var E = r(7815);
    (n = k || {})[n.Forwards = 0] = "Forwards";
    n[n.Backwards = 1] = "Backwards";
    var k = n;
    var b = r(14879);
    var y = r(15466);
    function C(...e) {
      return (0, u.useMemo)(() => (0, y.r)(...e), [...e]);
    }
    var R = r(3855);
    function T(e, t, r, n) {
      let o = (0, R.E)(r);
      (0, u.useEffect)(() => {
        function r(e) {
          o.current(e);
        }
        (e = e ?? window).addEventListener(t, r, n);
        return () => e.removeEventListener(t, r, n);
      }, [e, t, n]);
    }
    var L = r(81021);
    function M(e, t) {
      let r = (0, u.useRef)([]);
      let n = (0, w.z)(e);
      (0, u.useEffect)(() => {
        for (let [e, o] of t.entries()) {
          if (r.current[e] !== o) {
            let e = n(t);
            r.current = t;
            return e;
          }
        }
      }, [n, ...t]);
    }
    (o = x || {})[o.None = 1] = "None";
    o[o.InitialFocus = 2] = "InitialFocus";
    o[o.TabLock = 4] = "TabLock";
    o[o.FocusLock = 8] = "FocusLock";
    o[o.RestoreFocus = 16] = "RestoreFocus";
    o[o.All = 30] = "All";
    var x = o;
    let P = Object.assign((0, c.yV)(function (e, t) {
      let r;
      let n = (0, u.useRef)(null);
      let o = (0, d.T)(n, t);
      let {
        initialFocus: l,
        containers: a,
        features: i = 30,
        ...f
      } = e;
      if (!(0, h.H)()) {
        i = 1;
      }
      let p = C(n);
      (function ({
        ownerDocument: e
      }, t) {
        let r = (0, u.useRef)(null);
        T(e == null ? undefined : e.defaultView, "focusout", e => {
          if (!!t && !r.current) {
            r.current = e.target;
          }
        }, true);
        M(() => {
          if (!t) {
            (0, g.C5)(r.current);
            r.current = null;
          }
        }, [t]);
        let n = (0, u.useRef)(false);
        (0, u.useEffect)(() => {
          n.current = false;
          return () => {
            n.current = true;
            (0, L.Y)(() => {
              if (n.current) {
                (0, g.C5)(r.current);
                r.current = null;
              }
            });
          };
        }, []);
      })({
        ownerDocument: p
      }, !!(i & 16));
      let v = function ({
        ownerDocument: e,
        container: t,
        initialFocus: r
      }, n) {
        let o = (0, u.useRef)(null);
        M(() => {
          if (!n) {
            return;
          }
          let l = t.current;
          if (!l) {
            return;
          }
          let a = e == null ? undefined : e.activeElement;
          if (r != null && r.current) {
            if ((r == null ? undefined : r.current) === a) {
              o.current = a;
              return;
            }
          } else if (l.contains(a)) {
            o.current = a;
            return;
          }
          if (r != null && r.current) {
            (0, g.C5)(r.current);
          } else if ((0, g.jA)(l, g.TO.First) === g.fE.Error) {
            console.warn("There are no focusable elements inside the <FocusTrap />");
          }
          o.current = e == null ? undefined : e.activeElement;
        }, [n]);
        return o;
      }({
        ownerDocument: p,
        container: n,
        initialFocus: l
      }, !!(i & 2));
      (function ({
        ownerDocument: e,
        container: t,
        containers: r,
        previousActiveElement: n
      }, o) {
        let l = (0, b.t)();
        T(e == null ? undefined : e.defaultView, "focus", e => {
          if (!o || !l.current) {
            return;
          }
          let a = new Set(r == null ? undefined : r.current);
          a.add(t);
          let i = n.current;
          if (!i) {
            return;
          }
          let u = e.target;
          if (u && u instanceof HTMLElement) {
            if (function (e, t) {
              var r;
              for (let n of e) {
                if ((r = n.current) != null && r.contains(t)) {
                  return true;
                }
              }
              return false;
            }(a, u)) {
              n.current = u;
              (0, g.C5)(u);
            } else {
              e.preventDefault();
              e.stopPropagation();
              (0, g.C5)(i);
            }
          } else {
            (0, g.C5)(n.current);
          }
        }, true);
      })({
        ownerDocument: p,
        container: n,
        containers: a,
        previousActiveElement: v
      }, !!(i & 8));
      r = (0, u.useRef)(0);
      (0, E.s)("keydown", e => {
        if (e.key === "Tab") {
          r.current = e.shiftKey ? 1 : 0;
        }
      }, true);
      let y = r;
      let R = (0, w.z)(() => {
        let e = n.current;
        if (e) {
          (0, s.E)(y.current, {
            [k.Forwards]: () => (0, g.jA)(e, g.TO.First),
            [k.Backwards]: () => (0, g.jA)(e, g.TO.Last)
          });
        }
      });
      return u.createElement(u.Fragment, null, !!(i & 4) && u.createElement(m._, {
        as: "button",
        type: "button",
        onFocus: R,
        features: m.A.Focusable
      }), (0, c.sY)({
        ourProps: {
          ref: o
        },
        theirProps: f,
        defaultTag: "div",
        name: "FocusTrap"
      }), !!(i & 4) && u.createElement(m._, {
        as: "button",
        type: "button",
        onFocus: R,
        features: m.A.Focusable
      }));
    }), {
      features: x
    });
    var D = r(16723);
    let A = new Set();
    let j = new Map();
    function O(e) {
      e.setAttribute("aria-hidden", "true");
      e.inert = true;
    }
    function F(e) {
      let t = j.get(e);
      if (t) {
        if (t["aria-hidden"] === null) {
          e.removeAttribute("aria-hidden");
        } else {
          e.setAttribute("aria-hidden", t["aria-hidden"]);
        }
        e.inert = t.inert;
      }
    }
    var S = r(73935);
    let z = (0, u.createContext)(false);
    function B(e) {
      return u.createElement(z.Provider, {
        value: e.force
      }, e.children);
    }
    let V = u.Fragment;
    let Y = (0, c.yV)(function (e, t) {
      let r = (0, u.useRef)(null);
      let n = (0, d.T)((0, d.h)(e => {
        r.current = e;
      }), t);
      let o = C(r);
      let l = function (e) {
        let t = (0, u.useContext)(z);
        let r = (0, u.useContext)(I);
        let n = C(e);
        let [o, l] = (0, u.useState)(() => {
          if (!t && r !== null || typeof window == "undefined") {
            return null;
          }
          let e = n == null ? undefined : n.getElementById("headlessui-portal-root");
          if (e) {
            return e;
          }
          if (n === null) {
            return null;
          }
          let o = n.createElement("div");
          o.setAttribute("id", "headlessui-portal-root");
          return n.body.appendChild(o);
        });
        (0, u.useEffect)(() => {
          if (o !== null) {
            if ((n == null || !n.body.contains(o)) && n != null) {
              n.body.appendChild(o);
            }
          }
        }, [o, n]);
        (0, u.useEffect)(() => {
          if (!t) {
            if (r !== null) {
              l(r.current);
            }
          }
        }, [r, l, t]);
        return o;
      }(r);
      let [a] = (0, u.useState)(() => {
        if (typeof window == "undefined") {
          return null;
        } else {
          return (o == null ? undefined : o.createElement("div")) ?? null;
        }
      });
      let i = (0, h.H)();
      let s = (0, u.useRef)(false);
      (0, D.e)(() => {
        s.current = false;
        if (!!l && !!a) {
          if (!l.contains(a)) {
            l.appendChild(a);
          }
          return () => {
            s.current = true;
            (0, L.Y)(() => {
              var e;
              if (s.current && l && a) {
                l.removeChild(a);
                if (l.childNodes.length <= 0) {
                  if ((e = l.parentElement) != null) {
                    e.removeChild(l);
                  }
                }
              }
            });
          };
        }
      }, [l, a]);
      if (i && l && a) {
        return (0, S.createPortal)((0, c.sY)({
          ourProps: {
            ref: n
          },
          theirProps: e,
          defaultTag: V,
          name: "Portal"
        }), a);
      } else {
        return null;
      }
    });
    let H = u.Fragment;
    let I = (0, u.createContext)(null);
    let W = Object.assign(Y, {
      Group: (0, c.yV)(function (e, t) {
        let {
          target: r,
          ...n
        } = e;
        let o = {
          ref: (0, d.T)(t)
        };
        return u.createElement(I.Provider, {
          value: r
        }, (0, c.sY)({
          ourProps: o,
          theirProps: n,
          defaultTag: H,
          name: "Popover.Group"
        }));
      })
    });
    var Z = r(39516);
    var N = r(16567);
    let $ = (0, u.createContext)(() => {});
    $.displayName = "StackContext";
    (l = _ || {})[l.Add = 0] = "Add";
    l[l.Remove = 1] = "Remove";
    var _ = l;
    function q({
      children: e,
      onUpdate: t,
      type: r,
      element: n
    }) {
      let o = (0, u.useContext)($);
      let l = (0, w.z)((...e) => {
        if (t != null) {
          t(...e);
        }
        o(...e);
      });
      (0, D.e)(() => {
        l(0, r, n);
        return () => l(1, r, n);
      }, [l, r, n]);
      return u.createElement($.Provider, {
        value: l
      }, e);
    }
    var G = r(90292);
    (a = U || {})[a.Open = 0] = "Open";
    a[a.Closed = 1] = "Closed";
    var U = a;
    (i = J || {})[i.SetTitleId = 0] = "SetTitleId";
    var J = i;
    let K = {
      0: (e, t) => e.titleId === t.id ? e : {
        ...e,
        titleId: t.id
      }
    };
    let Q = (0, u.createContext)(null);
    function X(e) {
      let t = (0, u.useContext)(Q);
      if (t === null) {
        let t = Error(`<${e} /> is missing a parent <Dialog /> component.`);
        if (Error.captureStackTrace) {
          Error.captureStackTrace(t, X);
        }
        throw t;
      }
      return t;
    }
    function ee(e, t) {
      return (0, s.E)(t.type, K, e, t);
    }
    Q.displayName = "DialogContext";
    let et = c.AN.RenderStrategy | c.AN.Static;
    let er = (0, c.yV)(function (e, t) {
      let {
        open: r,
        onClose: n,
        initialFocus: o,
        __demoMode: l = false,
        ...a
      } = e;
      let [i, p] = (0, u.useState)(0);
      let g = (0, N.oJ)();
      if (r === undefined && g !== null) {
        r = (0, s.E)(g, {
          [N.ZM.Open]: true,
          [N.ZM.Closed]: false
        });
      }
      let E = (0, u.useRef)(new Set());
      let k = (0, u.useRef)(null);
      let b = (0, d.T)(k, t);
      let R = (0, u.useRef)(null);
      let L = C(k);
      let M = e.hasOwnProperty("open") || g !== null;
      let x = e.hasOwnProperty("onClose");
      if (!M && !x) {
        throw Error("You have to provide an `open` and an `onClose` prop to the `Dialog` component.");
      }
      if (!M) {
        throw Error("You provided an `onClose` prop to the `Dialog`, but forgot an `open` prop.");
      }
      if (!x) {
        throw Error("You provided an `open` prop to the `Dialog`, but forgot an `onClose` prop.");
      }
      if (typeof r != "boolean") {
        throw Error(`You provided an \`open\` prop to the \`Dialog\`, but the value is not a boolean. Received: ${r}`);
      }
      if (typeof n != "function") {
        throw Error(`You provided an \`onClose\` prop to the \`Dialog\`, but the value is not a function. Received: ${n}`);
      }
      let S = r ? 0 : 1;
      let [z, V] = (0, u.useReducer)(ee, {
        titleId: null,
        descriptionId: null,
        panelRef: (0, u.createRef)()
      });
      let Y = (0, w.z)(() => n(false));
      let H = (0, w.z)(e => V({
        type: 0,
        id: e
      }));
      let I = !!(0, h.H)() && !l && S === 0;
      let $ = i > 1;
      let U = (0, u.useContext)(Q) !== null;
      let J = $ ? "parent" : "leaf";
      (function (e, t = true) {
        (0, D.e)(() => {
          if (!t || !e.current) {
            return;
          }
          let r = e.current;
          let n = (0, y.r)(r);
          if (n) {
            A.add(r);
            for (let e of j.keys()) {
              if (e.contains(r)) {
                F(e);
                j.delete(e);
              }
            }
            n.querySelectorAll("body > *").forEach(e => {
              if (e instanceof HTMLElement) {
                for (let t of A) {
                  if (e.contains(t)) {
                    return;
                  }
                }
                if (A.size === 1) {
                  j.set(e, {
                    "aria-hidden": e.getAttribute("aria-hidden"),
                    inert: e.inert
                  });
                  O(e);
                }
              }
            });
            return () => {
              A.delete(r);
              if (A.size > 0) {
                n.querySelectorAll("body > *").forEach(e => {
                  if (e instanceof HTMLElement && !j.has(e)) {
                    for (let t of A) {
                      if (e.contains(t)) {
                        return;
                      }
                    }
                    j.set(e, {
                      "aria-hidden": e.getAttribute("aria-hidden"),
                      inert: e.inert
                    });
                    O(e);
                  }
                });
              } else {
                for (let e of j.keys()) {
                  F(e);
                  j.delete(e);
                }
              }
            };
          }
        }, [t]);
      })(k, !!$ && I);
      (0, G.O)(() => {
        return [...Array.from((L == null ? undefined : L.querySelectorAll("body > *")) ?? []).filter(e => !!(e instanceof HTMLElement) && !e.contains(R.current) && (!z.panelRef.current || !e.contains(z.panelRef.current))), z.panelRef.current ?? k.current];
      }, () => {
        if (S === 0) {
          if (!$) {
            Y();
          }
        }
      }, G.A.IgnoreScrollbars);
      T(L == null ? undefined : L.defaultView, "keydown", e => {
        if (!e.defaultPrevented) {
          if (e.key === f.R.Escape && S === 0) {
            if (!$) {
              e.preventDefault();
              e.stopPropagation();
              Y();
            }
          }
        }
      });
      (0, u.useEffect)(() => {
        if (S !== 0 || U) {
          return;
        }
        let t = (0, y.r)(k);
        if (!t) {
          return;
        }
        let r = t.documentElement;
        let n = t.defaultView ?? window;
        let o = r.style.overflow;
        let l = r.style.paddingRight;
        let a = n.innerWidth - r.clientWidth;
        r.style.overflow = "hidden";
        if (a > 0) {
          let e = r.clientWidth - r.offsetWidth;
          r.style.paddingRight = `${a - e}px`;
        }
        return () => {
          r.style.overflow = o;
          r.style.paddingRight = l;
        };
      }, [S, U]);
      (0, u.useEffect)(() => {
        if (S !== 0 || !k.current) {
          return;
        }
        let e = new IntersectionObserver(e => {
          for (let t of e) {
            if (t.boundingClientRect.x === 0 && t.boundingClientRect.y === 0 && t.boundingClientRect.width === 0 && t.boundingClientRect.height === 0) {
              Y();
            }
          }
        });
        e.observe(k.current);
        return () => e.disconnect();
      }, [S, k, Y]);
      let [K, X] = (0, Z.f)();
      let er = `headlessui-dialog-${(0, v.M)()}`;
      let en = (0, u.useMemo)(() => [{
        dialogState: S,
        close: Y,
        setTitleId: H
      }, z], [S, z, Y, H]);
      let eo = (0, u.useMemo)(() => ({
        open: S === 0
      }), [S]);
      let el = {
        ref: b,
        id: er,
        role: "dialog",
        "aria-modal": S === 0 || undefined,
        "aria-labelledby": z.titleId,
        "aria-describedby": K,
        onClick(e) {
          e.stopPropagation();
        }
      };
      return u.createElement(q, {
        type: "Dialog",
        element: k,
        onUpdate: (0, w.z)((e, t, r) => {
          if (t === "Dialog") {
            (0, s.E)(e, {
              [_.Add]() {
                E.current.add(r);
                p(e => e + 1);
              },
              [_.Remove]() {
                E.current.add(r);
                p(e => e - 1);
              }
            });
          }
        })
      }, u.createElement(B, {
        force: true
      }, u.createElement(W, null, u.createElement(Q.Provider, {
        value: en
      }, u.createElement(W.Group, {
        target: k
      }, u.createElement(B, {
        force: false
      }, u.createElement(X, {
        slot: eo,
        name: "Dialog.Description"
      }, u.createElement(P, {
        initialFocus: o,
        containers: E,
        features: I ? (0, s.E)(J, {
          parent: P.features.RestoreFocus,
          leaf: P.features.All & ~P.features.FocusLock
        }) : P.features.None
      }, (0, c.sY)({
        ourProps: el,
        theirProps: a,
        slot: eo,
        defaultTag: "div",
        features: et,
        visible: S === 0,
        name: "Dialog"
      })))))))), u.createElement(m._, {
        features: m.A.Hidden,
        ref: R
      }));
    });
    let en = (0, c.yV)(function (e, t) {
      let [{
        dialogState: r,
        close: n
      }] = X("Dialog.Overlay");
      let o = (0, d.T)(t);
      let l = `headlessui-dialog-overlay-${(0, v.M)()}`;
      let a = (0, w.z)(e => {
        if (e.target === e.currentTarget) {
          if ((0, p.P)(e.currentTarget)) {
            return e.preventDefault();
          }
          e.preventDefault();
          e.stopPropagation();
          n();
        }
      });
      let i = (0, u.useMemo)(() => ({
        open: r === 0
      }), [r]);
      return (0, c.sY)({
        ourProps: {
          ref: o,
          id: l,
          "aria-hidden": true,
          onClick: a
        },
        theirProps: e,
        slot: i,
        defaultTag: "div",
        name: "Dialog.Overlay"
      });
    });
    let eo = Object.assign(er, {
      Backdrop: (0, c.yV)(function (e, t) {
        let [{
          dialogState: r
        }, n] = X("Dialog.Backdrop");
        let o = (0, d.T)(t);
        let l = `headlessui-dialog-backdrop-${(0, v.M)()}`;
        (0, u.useEffect)(() => {
          if (n.panelRef.current === null) {
            throw Error("A <Dialog.Backdrop /> component is being used, but a <Dialog.Panel /> component is missing.");
          }
        }, [n.panelRef]);
        let a = (0, u.useMemo)(() => ({
          open: r === 0
        }), [r]);
        return u.createElement(B, {
          force: true
        }, u.createElement(W, null, (0, c.sY)({
          ourProps: {
            ref: o,
            id: l,
            "aria-hidden": true
          },
          theirProps: e,
          slot: a,
          defaultTag: "div",
          name: "Dialog.Backdrop"
        })));
      }),
      Panel: (0, c.yV)(function (e, t) {
        let [{
          dialogState: r
        }, n] = X("Dialog.Panel");
        let o = (0, d.T)(t, n.panelRef);
        let l = `headlessui-dialog-panel-${(0, v.M)()}`;
        let a = (0, u.useMemo)(() => ({
          open: r === 0
        }), [r]);
        return (0, c.sY)({
          ourProps: {
            ref: o,
            id: l
          },
          theirProps: e,
          slot: a,
          defaultTag: "div",
          name: "Dialog.Panel"
        });
      }),
      Overlay: en,
      Title: (0, c.yV)(function (e, t) {
        let [{
          dialogState: r,
          setTitleId: n
        }] = X("Dialog.Title");
        let o = `headlessui-dialog-title-${(0, v.M)()}`;
        let l = (0, d.T)(t);
        (0, u.useEffect)(() => {
          n(o);
          return () => n(null);
        }, [o, n]);
        let a = (0, u.useMemo)(() => ({
          open: r === 0
        }), [r]);
        return (0, c.sY)({
          ourProps: {
            ref: l,
            id: o
          },
          theirProps: e,
          slot: a,
          defaultTag: "h2",
          name: "Dialog.Title"
        });
      }),
      Description: Z.d
    });
  },
  39424: function (e, t, r) {
    var n = r(67294);
    let o = n.forwardRef(function (e, t) {
      return n.createElement("svg", Object.assign({
        xmlns: "http://www.w3.org/2000/svg",
        fill: "none",
        viewBox: "0 0 24 24",
        strokeWidth: 2,
        stroke: "currentColor",
        "aria-hidden": "true",
        ref: t
      }, e), n.createElement("path", {
        strokeLinecap: "round",
        strokeLinejoin: "round",
        d: "M11 17l-5-5m0 0l5-5m-5 5h12"
      }));
    });
    t.Z = o;
  },
  97298: function (e, t, r) {
    var n = r(67294);
    let o = n.forwardRef(function (e, t) {
      return n.createElement("svg", Object.assign({
        xmlns: "http://www.w3.org/2000/svg",
        fill: "none",
        viewBox: "0 0 24 24",
        strokeWidth: 2,
        stroke: "currentColor",
        "aria-hidden": "true",
        ref: t
      }, e), n.createElement("path", {
        strokeLinecap: "round",
        strokeLinejoin: "round",
        d: "M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
      }), n.createElement("path", {
        strokeLinecap: "round",
        strokeLinejoin: "round",
        d: "M15 13a3 3 0 11-6 0 3 3 0 016 0z"
      }));
    });
    t.Z = o;
  },
  69641: function (e, t, r) {
    var n = r(67294);
    let o = n.forwardRef(function (e, t) {
      return n.createElement("svg", Object.assign({
        xmlns: "http://www.w3.org/2000/svg",
        fill: "none",
        viewBox: "0 0 24 24",
        strokeWidth: 2,
        stroke: "currentColor",
        "aria-hidden": "true",
        ref: t
      }, e), n.createElement("path", {
        strokeLinecap: "round",
        strokeLinejoin: "round",
        d: "M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"
      }));
    });
    t.Z = o;
  },
  66293: function (e, t, r) {
    var n = r(67294);
    let o = n.forwardRef(function (e, t) {
      return n.createElement("svg", Object.assign({
        xmlns: "http://www.w3.org/2000/svg",
        fill: "none",
        viewBox: "0 0 24 24",
        strokeWidth: 2,
        stroke: "currentColor",
        "aria-hidden": "true",
        ref: t
      }, e), n.createElement("path", {
        strokeLinecap: "round",
        strokeLinejoin: "round",
        d: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
      }));
    });
    t.Z = o;
  },
  77082: function (e, t, r) {
    var n = r(67294);
    let o = n.forwardRef(function (e, t) {
      return n.createElement("svg", Object.assign({
        xmlns: "http://www.w3.org/2000/svg",
        fill: "none",
        viewBox: "0 0 24 24",
        strokeWidth: 2,
        stroke: "currentColor",
        "aria-hidden": "true",
        ref: t
      }, e), n.createElement("path", {
        strokeLinecap: "round",
        strokeLinejoin: "round",
        d: "M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
      }));
    });
    t.Z = o;
  },
  24634: function (e, t, r) {
    var n = r(67294);
    let o = n.forwardRef(function (e, t) {
      return n.createElement("svg", Object.assign({
        xmlns: "http://www.w3.org/2000/svg",
        fill: "none",
        viewBox: "0 0 24 24",
        strokeWidth: 2,
        stroke: "currentColor",
        "aria-hidden": "true",
        ref: t
      }, e), n.createElement("path", {
        strokeLinecap: "round",
        strokeLinejoin: "round",
        d: "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
      }));
    });
    t.Z = o;
  },
  20839: function (e, t, r) {
    var n = r(67294);
    let o = n.forwardRef(function (e, t) {
      return n.createElement("svg", Object.assign({
        xmlns: "http://www.w3.org/2000/svg",
        fill: "none",
        viewBox: "0 0 24 24",
        strokeWidth: 2,
        stroke: "currentColor",
        "aria-hidden": "true",
        ref: t
      }, e), n.createElement("path", {
        strokeLinecap: "round",
        strokeLinejoin: "round",
        d: "M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
      }));
    });
    t.Z = o;
  },
  95301: function (e, t, r) {
    var n = r(67294);
    let o = n.forwardRef(function (e, t) {
      return n.createElement("svg", Object.assign({
        xmlns: "http://www.w3.org/2000/svg",
        fill: "none",
        viewBox: "0 0 24 24",
        strokeWidth: 2,
        stroke: "currentColor",
        "aria-hidden": "true",
        ref: t
      }, e), n.createElement("path", {
        strokeLinecap: "round",
        strokeLinejoin: "round",
        d: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
      }));
    });
    t.Z = o;
  },
  36388: function (e, t, r) {
    var n = r(67294);
    let o = n.forwardRef(function (e, t) {
      return n.createElement("svg", Object.assign({
        xmlns: "http://www.w3.org/2000/svg",
        fill: "none",
        viewBox: "0 0 24 24",
        strokeWidth: 2,
        stroke: "currentColor",
        "aria-hidden": "true",
        ref: t
      }, e), n.createElement("path", {
        strokeLinecap: "round",
        strokeLinejoin: "round",
        d: "M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
      }));
    });
    t.Z = o;
  },
  63326: function (e, t, r) {
    var n = r(67294);
    let o = n.forwardRef(function (e, t) {
      return n.createElement("svg", Object.assign({
        xmlns: "http://www.w3.org/2000/svg",
        viewBox: "0 0 20 20",
        fill: "currentColor",
        "aria-hidden": "true",
        ref: t
      }, e), n.createElement("path", {
        d: "M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z"
      }));
    });
    t.Z = o;
  },
  68163: function (e, t, r) {
    var n = r(67294);
    let o = n.forwardRef(function (e, t) {
      return n.createElement("svg", Object.assign({
        xmlns: "http://www.w3.org/2000/svg",
        viewBox: "0 0 20 20",
        fill: "currentColor",
        "aria-hidden": "true",
        ref: t
      }, e), n.createElement("path", {
        fillRule: "evenodd",
        d: "M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z",
        clipRule: "evenodd"
      }));
    });
    t.Z = o;
  }
}]);