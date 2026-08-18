import React, { useState, useEffect, useMemo, useCallback, useRef, createContext, useContext } from "react";
import {
  Dice5, Dice1, Calendar, Library, Home, LogIn, LogOut, UserPlus, Plus, Star, Search,
  Download, MapPin, Clock, Users, X, Menu, Trophy, Filter, Check, ChevronRight,
  Heart, ThumbsUp, Sparkles, BookOpen, RotateCcw, Trash2, Edit3, ExternalLink, Globe, PenLine, Loader2,
  ArrowRight, Crown, Mail, ShieldCheck, Gamepad2, ChevronDown, Award, Info, AlertTriangle, Eye, EyeOff,
  Euro, Lock, ArrowRightLeft, Package, ShoppingBag, Ticket, RefreshCw, CalendarPlus, Copy, HelpCircle,
  EyeOff as EyeOffIcon, TrendingUp, TrendingDown, MessageCircle, Pencil
} from "lucide-react";
import { supabase, isConfigured } from "./supabaseClient";
import PlayTimer, { ScorePad } from "./PlayTimer";

/* =============================================================================
   ALADJ — À l'assaut des jeux  ·  version connectée à Supabase
   ============================================================================= */

/* ---------- Palette (issue du logo) ---------- */
// Logo officiel ALADJ (détouré, fond transparent)
const LOGO_URL = "data:image/webp;base64,UklGRrpJAABXRUJQVlA4WAoAAAAQAAAAsgAAlQAAQUxQSIAcAAAB/yckSPD/eGtEpO4Tjtu2ESTJmdcl13/BM7O7JUT0fwK4zqjysji/qRuw1kUpBBRkocKUSXczJa0y6maSbIm6ujMPkpyGnsybaJInM9G1/bckajKdJokF2WfTFnraWiZpR0QZEFjLqvQA1CZKFgL9A5JDmUmqtgXQ2u2R4wk4cH8QevgCmk/UmbnBG7b9i6TG/3e9Xu/qMWBwD2SwICHEdRPi7v5Z36y7u7u7u7vE3X3ZeIjgLsEh2EhXve8H3V1d3QyfxxExAfSH5hYjwJDxUw+aNmroeI1vlyHbvo2l3QvXrFmyei9AsBj5f6E5aRSDZx0ze/bgMtUlA+FU792w9H8vvLBsN1gItt8LIY0MOvKU00fThOseu+/WZUDi+zNPgKEXnjeHnDtXr122a1GM27eF3pEdHTBqzNSx40a1VAA9z95/hoMF2095gM7zfnUMIIPe9c88/fSmPRTaMbrruBmzZg6gUs9/9mDAbD/kBtM+u0Ci4vn1/35EVA0GqIYBiqJywpyzTjtwEJJ677xiLATbz4QAJ/ymW4pi64vX32kAwYQiRZoZZEDL2BPPX6vKDd8dB4ntRzzAaXepsvuWW++nMkipaKiZkQEDr7h2qyRt/9ZQCPsLC3DyjVKUFn19JmDBaVYzFzDh089J0rr3DMR8vxCg67eSlN586UDwxGhy8wDJ5Q9I0jPXQGL9nkHbF3YoU/cdJwPu7JMWgHPvipKuPwi8n7OMs5+TFP9wMHgw9lkLBqffJunlH5UI/ZrTemqU9J/jwZ19PDhcukDSLZNw67cMDjnZpKffBsHpB90Y8tUd0tZX4tZfZRw+C7Z9toQH+skAU+6Q9JMOQr9k7lM74cVZWKD/tAAf3i3dMBTvhyxrnwN7r1tFMPpVN25/HiaMw/ofhgyEl+btwelvY2DpMzCxBet3SiPg4Y0koh+O1vNEH5mjfqY75eWHliLRL8tZvBaM/lSoj7VLCaK/FqzYws5NqN+Q7+5jx3ws0q9vXU1G/xn3bmBRCdG/q7VvLys2BfULCslSkh5Ev9/XtoWlPb7PmZmVvHX+rzFnn7bmkO3u4SkL+5CZWYxUdVqN5jfMDBAZTeskzCPsG+YWI0AyZcLMn991bhIo3BoQMvKOTNiBNQGQLBnq1nzuMQIDZhzadfS0roC0stWtADOHGMGLotQxdlTXQbROC5N9bOKPN0lk5Afw5gMGzz7jmDkHUBljuU9XEvJ5SBKj+shIoWYDf3Ru53An9wWEXAZWCDCAZjc44hVnHzkGIJOZGSrrZstnVA7vOmjS5K4xY/k0XkDCpQJiBAzDSJPvk9QyD3ikuidJsByKNLtZ663nAsrMnOqK2j7BLYcx+dJP/ubxbUOp/jxWQOC3aUwwcmbhH4QaTtVBMmS7qfTEq2FWwzADyydiAYHzlcncyCulegdJLec9PaoahVmW/INQAL5M0ckt2z0Cr2IcfNKbrr1r1Bgqtz7yq/f+30wAr1LbRNFmIZ/p4kgw6n8DWS24qrXPcbMA4DaJWJ9rSp+oN9MrSSpCdv4vxlPv7vvuvm0JZjEPpZbhYxh4YBwxTlaxtDsuTdf27e4hv5UHnIaoP+jwWfIcLysE8m7GCshOIa0r1XWECmPu+LKDWRVJuMOeO785D0PVzGb9cLwBOPn3ZNs3b/tzLo9HECkyK11DLflII6+4H68vTjyM+qWXOjAq+6IF6lRUQrzvqw9kSVol4ROAUCS3m1G36ayCnKsGplbFZCUsj7Gc+i1rnYPXRZqdTqjykhsFKgZ6b/nkIqsSuHRaTBzzfCCEQh5Lw4V4MXHiseZVkA+izlCAx8nEpL6y3m1JlXUUnQVWfeEvwapc2CoKlm3M49nBKBRC5HWidks9KsA4juj1ZXoSAyKbCQWhGPgYwSpOGmLFLcsDF5EWFLhscmYV8rgB5QksJ9Yl5lBkjC+Px0Cs29shKwai/DctGE7XuJKsqOfziLMwirVs4CkWKkC91NlL3ZYOmUMoQGW9lQRgy67RNDDqqxbMGGAjisrCzTk8HT2BUBBZuFexiqlcjxWgI4hFgI4GkHVvIDZAGZvlkGyn+I05jNPIChO9XdErIJ/Yvh7V5edJXoTbyaXMwOMa1AAwXiSalqDC1uSI9noZhafJ66iipCUXpH3UHXUcxXqcergMjA00Vv7SFkvi8wUpxTbWstg5kQZk4XyyCks31BG8Ls+GjcALQTa3zQCWNYjojz9V6l0ZYyYwM8tlSWB5LY+HK4bixBEz5RW8hHL1pHWZjiCGYuDysir6GoVl31HfKm+huqyWWP7VdOOAWsZZZF4caXI5FSDyil4VcDzRiwk6ZnJ0xAqsQVlY8BjPPjZy2dq1q3qX93zztCxUy7jnU+TNOAujgZHXlLIqaS5oba8rcjJGwdEPxoAdNNx4S+/GY0tlqj6NqG5MSzymNTyb1oY3gjj9eIWKPXX07a3HYtuo4sSZgFiTBTUo9T/PS9KyOxDKW8mrlJxBZ5AljeGVGIiH8BxiZ5+pDo2bWlzgyvFy6C3T6CT+3xKCUZnEkMPoWhetlnM+soY4Z3VmBuzBckB3Rp3GkZYVZhoxMiA2bkUNQq1HE6ipHJBk1DYGTCfQmDh5tpzI+j2mPEZ9r0AUHnVi2bF0Ew0Xx5PUqtNyBI4mNojIFRjQk9LQyDFYcfKjQBa3okY5hwWzAozRhtVIOJnoDQpcNSgzsWMTaoDFYTPw4pzjQmbGmsYZUw7AC4CEnMZZGA22OP5UOZatbUhg7tDMGhCnnyU3ttBwi22nEwpRDueAkXijiDrTDGdzPtUDRyIaGDkGFxsbRwzvJykE1Uq4lCxpmNtVw1Iz1pHT6Rokq2M81gjjVMuMXU0A3ypG3loL5iJrXDbqWAIsySP2lMltWTiuMc5hgyMsxptgBUValkzAqmXMxWm8uMQQC/A8W3pMuTT8wMaYBk3H6MaaoOGeTWtTMzinJRlsyGO0J+Q2ZrTFhpD5KTiIJlQOFRRfQZo0gyYdJaevTN7BLbJ8B3ukoc6V7WXW9pgaNzhHSzFwNM0Z/Y0WWbce5ahX3kWDjcOHRNv5Mg33OB/VmJ5DSbYaVcnCcVhTGCeFGHoXEnPs7DPliqdgDYpxJr5rE2qQvO/JHHX2UdWz6SVCU7gmHaLASlTDGDdAlsNixzi8McTkIjOcRovlW61axoFYHqsRjyVrDrKWc3CWkDfNyGuMGos1CEbJWUVs2POpV5N35nKqi1ORNYdxcZKyBsvRFvYAhhsR4iFEGixO6kzZRKPFvzAqjc4xOWRbQBWZHYnTnIHDJqask9cwOts3O5SJAiIHN454wOGRlQ1zfkmsMXJQDujJqPQ4MVGzkLaehT+7xWI1hGUZJCOmzZhx5Nb3rhtG46OmgxqVhbvXumqMa4nUlG0NVu0QstAsxgUedr+AakROWHf0hDnHJADDe249GmuY2TmwBGuM+BU5JpADtmKici6yZnFOPbDMyhyBH5xDpTKykjMNzydJOOB5OAiW4Q3Jkuf/4hk1J5G7m6qRYzGa1bKO4+B58pY8E24esL5lo3rJHc0o0Bg/jt2yhhC+YUG1ZmO1ZCtxwLIhBzQR4hRYgOUQiVEpT9cencnyQO/GDfOfWdAb5/xcObIhJ7BpC2pADLfdYKKqZTYtD6yi0uPxxKR5nDPbeXZ3UC2jpnyVzialdhZ+/I9163up+sIs1UAcR2Y0UMTL8Voa3JWvu4oxlUgTx0knsmEtOXIHppFTnn19HViShNAafqJYyzkt7HkJFaY+fccCNQMzhiiHsQZReRRNHTmDbEUhYgUzsDyrtwaiABLeK2obU4aW9zQg1W8Tt1oJJ1pGTXn5hSqZH4o1k3GyM6+gRzg0Fyt7PFLV6Xo5qJYGTWJdcVF/bUmc2oG55LXN64ngGjkZb6agw6ewDCsA5tBBTrEaI+fTVoto09hO8f8w8hodRxNqRZZ3G2DMGBStmYgtl9jysqk+4+7O0Vgt2JgnsZ8Sa4lTWF6QjIEjR3/iltHm1RIuHpNZLfEsAXAOI9Lk5yWPrfUCnNumlKLnWUTO0P52rJYxnt3FKGH3Ln4g/ZRQLYS/IWobT1Apm0aTG4cMiusowCiPQtR2FqFaxqhdQTWck9sX4PUpY++SnoF/UbkvzrBQ4TZjt0IOZz4RyDgcby6Pw0/Q/LoURZJNyyPvXW95rGUrtYwBw3aJepWVWPU/OscqVaqbwMFK/E3Rask2LkGAOmdiDRFYHUQu5tqI15Ai7sDaLTPJGbVyUCBn4I63xRrIZtwyKcjyKEvY8bflHNLFXALwZHu3G9k5N7pTO+OxXaGCsZ2iYEnCnfqdU1peyEoyFEUwgN33rixfm04BhCQMLSF3wkJqK/Nz/5GOFjUVCey85Z4XmDIUEaic+86F8IYfDZTlgP9gVE4J0eqSJDOnMm4bEqweTZ626YljorsB9Lx044JFi14CbFgao1NdPzLPE3i6p0VRQHBj9JpeqipiDmvu/cqjjDtyCE5CpbH7sa1dRyOjtpLee4hVDkXUKzcz2LFi1fIXV61f++qfZiEfmZ8eH/0QsH3+o1se3PJSL+AO2YAEuktrn1m2dv2qw8hvPJU5gcqXOxffwcosDYZbgG1P/POGLdiso8mMnA5EM3JG/W+tV5tN/bZ3xerHli5fuomqYxYNwvIZp/LHX7T9++5lW6gMpqgU0/sOWrdldcv6biotH9573VU9D3Trsd2rl3QAPaEVoPuZRffe/RIkcdEUZORVlAVyy27GqToOqyMLX/9doGowJLM//V+a5HOOHj6fSnckiaribqoGAzn19r22q7yOqptJ0p++c0tLz92rNi0G3DOLR5ZNNFRhx9/JqoyYVJdxF8EdRVHpYe7d0fNZHD/FPAtEUWcwISQ3oz5sJQEMRVOZu86nqjlRQOj4nmWNyfjbmqAqA4fX5bHsMUbytiydED0XkYtUKlNgRlWPAMHqkZNRVUCfu+RSNATgHxm5J8aGBPsBour4dtUh27iROgO/jGXVkhR7y/fisYjqnk474aDNs8DqqNeoGhwSBzBe0xm9AZHPtFNzukfyR1+NZ/WcqayW0nIq6RGz4jx9+5tgZO+vOrFGVDdobQensvVUGujxkoHRa0xAdchW4jGfWccaZQ6KCiZpz8PfPgwvLJTPv4AUpEeGYnWYG3gu5+xbVi7+5gQMsGzgQcWZBlyJUXMy9c+n7oTvZr2BALDhjq9eOIFKAxUSw1eUtUHs1eWEXMFSKkOOwCdUuXiGGeAMG1RY1DmWZ3Bdpm31BY6VgE1PPfjIswCWuEcqgyFJeTxOTRQAlbMfktSyEEU48wx/cQKllmrOlN6sHLMe3YtTtVWgItwu7IpG7TFYrigLG1A9WPjt/Pn3Pr5mB+BJcCzAcE+3U9OJ1bylPImsmv5opRoOnD/7qiOA+ed14F6R8H6VJcWsZyJeIV5eRRJVj8TiQ0Xe0TUkyQL4ruUFACED3BUBHI7+zsFJuiFd9uKylZte2kZ1DzBogpxqvyeEKk77ldecCzGC9OTJULKKX8YKpTqXEAGM7jv3ELKYRzFhzVPkL4OIskDlqmXz5nV6WoDjHiWqJrR+o6eVnNvWPf3H+w0LcMaPT6FGjFu/mOAGbhctFKTuQJYq+8UFEEh4vypiFqfjWQViyw0395JYigHCArseXofnG5daIACrn332mSVloMUo0qhtkanHtJI5CAl3YP4RbnDI36LAyPn01/+JO119KlugZnT0kT8QnGl7FSH6HYs8xiqoBQ7+/gqJmqt+OBlz8ncY2e57X5y/czVVE6fRYvYcUjdyKrJzJmHA63YploNRWzHwy0EkyU/UJ3Kn7k8cgTnX7M2IvuId5DaHQSd/eObwtrYdu1c8PQgC9V49+8Vn96wBsCCJhpv8mGGYUafsWPikVJbIH2Py8CRKz8asDkiTLVPMrX2VotkbVnrMAx7IHZy6/wUQDMWY0YRmA2aTOXVn4RqGbsxS1QVlPcTwLYp10aev02KHptEgM6NeCwkShskoMBiRjKZNuIfMqD9NPs8spbEIUh11tlLVl8afeStfUNkyDlV9jc5obuO/SUYhv2Tg84rlWECfzn6/ygVk+qyXBi1QhvHakDVZsxtPhkKycAtMfbBPqktoz7A7lNYneo80PqdUhHjc8YR9LLGGBK4NaRHRF7caQw5/y6qI5UMLL2jfqqy+6C/AST1pFIhPSwVZSJsEQiOMjRQq29KJw2GbIrmjvfCWh7vPwETd4nlr+SqZASGePTeGYlKatPVTc/AGwNJiIE7FS1ynNOTKwk0XhWffYxlFzONtpK1Uiq+hIozxnxmMNc6s7dm1p+ONKFp2PC2c3JdG8qtvOj/+S5IWEOJ9be9WoGqIxx0fQ32i96KF7dYEGCf0bJtFKEwsxQrJwqUkLQ8oVR1p8iPetDCJ9cl2rjqLLKlG9Euwuix425hzo9OM3nZRXHUopeKe7gsqIvUPwmnKVI/YNeKonai+yGOcLKyG8wqyejwbHpk9QNYUtPBJLT2XUNimTRRSLl0G18VyXWThwsGPW1990n12IrnHJKpDlFO69hjN2s6vtGkuXgxW3kqRafJgO7P7MhXgD8w9cz1ZrMftCdryeUr+SHdkfKfTtObT/iNdiBcij+tQfVmYd0ULX1a5ANnOxYcf+GenzuiLH05Wj8thlA72fObtZC0pTWzwZ/VdQSiCUlhdQPTbL+uGy3EKzMIV/4HXfGiOWR7Zoo1jx3VYLaKyFafhNdzGP6XnDyQ0T3Dc+aKewGtY8BweH6HuLNz9ht1JeuJBWBHRH37Ix7YecHy+/FIkAZ6aalYj4ff63WA3PDQLJGbOORe41cg/4LgjM69HtjFx0WbFFB5lBlG4A8y//VYwAAOMk84GcJq15aTxYBi13SZceylexfnnlYAyMDOsSsNjBDPPIyGBO5W7Vvzvief+CxhgTk0zKzHnbKwJjM5sy+dHkeChFpO06xjzCrMpF5w8o6s9oWqUwKoYZkVVFUgIsEDNnh3PLXxx0aL1AIkMDBhaxQMB3tu3xs0ahyWfTnXzaJza1sa7+n5MUgH8ADvggINmDZ/YNXqgk18RUD1WEaizvHnvyjWbFy9bvmMnlcGiBBYIw3/+hGEAgVG/166zzWlG46intfwivIaF5O/zfn8kXs2CsjVU+sjBB4wZN2r42GEa2alhCRZo4NbM1nfvWbV5Q8+yTTu2pd1UdUdRVIYEhnOV1g2uYhzznJ44gkBzlhj6N+n9eBUr8V1JxxIAD0aKmRnESM6kndEje8OBYNOTfHtWIOtbjtaltou87iBJVHcijP79hitfWV7SVmEtH850yxBaadYAr1rya68W+Jh60w0jMOo285AkSeJmNKmZA8HdjNxuQOmCLx2/Wzv/qxVJhbf8bt0bO4LTvGZ0DsAqAifuLZd1Hw7Gyae0YkliVXKbmYNZURIIRKGeGDD7uDGpzp+xStIDHqg6nGYPVHfGb1RW1tdJwEor9F0ClWb59lULBnDm2DenK/zWvhs5cnWmh3CrgluTYVZhofNOlZXqPBICczN9mraPfX6YOXg/APihH3tYXzpX5QkXa9cEZmxQ/LwlVmHso4FvqzeL6unCCfxam7o4XroAGz4CwJPE96XSqUOOTCXdzip9onWbvhi4W1HfYp/28IaYSZkWBjCGbojfhenbs2nW/uLG6zotATBwt2YxEYxggJndoS93vlxeftlBfF9P85f4VKvdrQ3SjweZ7TNmo/q0548PlvUbAglvkk423qMft/IpSRNh5me/PBN3IAABsmIMAQ4RTNQMXJc9wm26nfHhLGUHnqruKTyhT90t/ZiwD7V+7YmLhs3uzt5IgnNPXDDcOPlqZ+SWLHZPLJ28Q9pxrDH90LGYLAMwVwyKFgBlVcA8o3L8zl1vnPfi9wIGCa/V7o43qO+ZrecMX6VvsEHvYVX61qE33zXDfJ+pdLhaOo/gdO3Vpy0Bgn1LfdoxqvS41q3SHfau3dn2z7vphHOPB5HbVNFCb7TSu/52/eOPDrxEkr5RCuDMLOtV46Kkj/FjrT5gXvbblpf1Bga1Y+zLwRKfet3jA7GET2rPaBwv+extWarFDNwQP/4W3Tl7lyTN0Li7b310Gufe8IPO1/zu7GnfGJDGln89kKRT/zScjb/848CyJLX8NF24WM+UzMCTx/UHe0a7PtTG7Cwu2KwPJDd+fnTw4PSDDmatC9Ot75mMEfihypmWBn82Pj75sllztedVW3Uur2nvy0ZwvLaNvEXf/7wAPkFg9CSY8NaHvv9kuvJLl9t39djhb5+EAa3+HS0pfVqrW4efbH+XtOFAK9FPmgPOxN2Suo8m8UN7+vpSLS6Fz0h/glNUPvHdPxrNBcKHMDa9kf+W3/eqpcMHrlx6PxnLR3UoJp//9F/1W+AE6cmLMKpeqr7xM2Kct0pzOt//jy/PwPB+AgwwO/hX87qXDLeE36vyLuBP0ut9xBJtmAhTjyaYk+kGFupdlG46+z8fh4g5BI1v+bYWXPuPNj4i6a8j3bz0jp+PWKdX2qoo6UqqG/3vQVNJOLKsn3xpsf495m8/Hzk/ewRm7dLzQ7i6LRNdHKR/tKzQaw3RErwMwiBa17skabwx/QHpK5SYLP11i67mZ3ruK2e4JyFx+t9SCbDAKzes7uCm7M8nSUf8KXto6BtPvKZP17S+EochlPSljl6djIGyBLGpPF6GhQu053efPYBJrxzzaLq4zUK4RdLWMdZ1RjvgweifvRQARk6z5Dr9enBaXrNDH/ykFg1ckX7qqIOzGJnCIL2toyceT04LgBh+VOwdDUM26Ou/S5e14sz6zxO3X9hmQFIK9MdGx0+uKEFwHIyOc2fxsSg9OfG92n33Ll3+mShJv2KzThqrvQfksPCMMmU6bmSmP3//D0P+KknfI1DbQgCO/ts0vL/B/dXL5l8zBDy4U+kc+7ZXDwxdqyU9NXFRdtNbr0//zAvpf/6Y7R5fS4Frs74+bWwfuCVKOr1tXt/2nw00A3Pc8QQ4/M9LP9Tp1u8AY36VbvrMAUBws+A4gCeHf+mPXxh7hHQOn9MCv1mSbmlJUKwAbpMU34S/qA0P/no6g2aMpqZ5CJC87indM4X+2WHWLYq3v7IFwAFPEqN6y0lnJKVT//2TZPpD0vw5JLR4qGKfWfb0X07ArWvuMMCAYBUWDJjwvqV65DIn6Z+wAMffIi3+4ux2g8SNSk+SxMjpx53QhsF7xiwlg8ySBHAqLTHMDbAQgIkX/KFHj88FjH7bHU68XtKLPzkEICRuVA8BzB2n5gJAVA8B8GBUNU8C0HH8d7ZIT5zWirnRn3uAY760SSo//uWTSgAhcSO3hWAVblFUmpHXQmIAHef9fqnU95ezOiHQ7weDEW9+QJIW/u6aKQbgSRLcqtWO1GsekmAAA2a/5Q9LJS3/+CQgGPtDT4DDv/ikJO156ndvmtNJ1WAgJFRR0zDDQKkkGHTwIRdOzoCNvzmrAzwY+0tLAD/mcw/0SVK67u5vveoVq19KyWkKhjITICGgNPbAA18xcySVyx6940UgOPtXTwCOfPd/lqn6njXLl21dujRu21HeSd7BycBRQ8ZOGT55YqDqlmcefWgjEIKx/zVPDOg45oPXLtglUbOnu3cDxspuBkwUjCOldrZlwfO3rAIIRPbbHgJAx8RT3jdr0tiRQ1soes+mLcsWP7OMSnfFlP27hSRQNRkxbuIx5emdU2VjOgRoVbTepdtXrV+7sUz1QMwi+zxWUDggFC0AAHB/AJ0BKrMAlgA+MRKHQqIhDM3jNBABglqCHABlKFCtXx+/I/2z9lP6l+yHylVr+8/2f9Yf3f3RdPnYvmL87/8P7k/mR/g/2O9x36K/73uC/rR/wOoN+7HqE/bz9ePdr/4v7a+6D+wf7/9hf7t8gH9G/u3/x9qX/wexB/ff+R/8/cG/mv9+/8nrvfun8Fn9e/4n7ifAd/Qv9F/7vYA/+fqAf+H1AOw5/pP4Z/rn6j/0v+k/i3+5Prr+FfI/078f/7Z/4/9V8WX8B03f8l6NfxP6xfa/77+2H91/dj4k/wf23ejvwQ/kfto+QX8V/kP9x/Lz+6/u19OHq/+E7aTQ/7B/bvUC9X/k/9t/r/7b/3395/Yi/gPzO9xvzf+if3b8rv8B///wA/i38i/u/9z/bb+5f//6L/uf978WH6f/jf8T+YH+7+wH+KfzX++/2L/L/6r/If///zfiP+8f7D/F/57/r/6b//+838n/sn+p/yP+M/5v+B////q/QL+Mfyn/A/2v/Gf9L+6f///s/dH7EP149in9Rf0//c39/3gDtomD82NWFKLj9saZHo35osKHucX2JV6XuWWTCwqFjeFNAwHmsBLbfuElvbJ1q1ceTXzp6yg4bHx7cYDi04Pb9yMT+CYmH70AfyKdPPzRmm6NFhI/xjkmwni9jupbVkMn75urshuiD9RGYm8APHiBQDd99lpxqgcdWzBaJ23JtS82KW5r8IYh/rmmn2l8q1jNz2/3NFbbdSJece9M+TNkSk66A3Ii33MRslfRbLCEH9vvtlrpaXwglp9jorrmgWk/4OqXD5rf9ICUsN7hnoQZMXAfQDgtYdoQVwlVdzXIReBkZQNuAYZui7YaBYF91fho8XgptsVvNyRap/dVdYDD25AwD+Rjubfud7uqeUAAXQmGWsqbeoLsclJEIyrPhD7FJmea+Vdf6dQPd6/6ZdXtfV9f/yxCfxHvCKq+vY/756O/gOBZErQzowKMXBZ+V/aA4/SjYSOqCNefMLTO7+pZ/KO7js3zCF7O6hKGiH5S0zPueH+4otrnufAUQlmKxNSQT/LDKL2n3e+DmxiVzpCJYKDHPTU3o9frncwZWMlBTb0vpCaMoejPBcY27DYpEi6G6Xm4BjbQUTgzrQqKw+e7xm7DrgdxLoFYM87x4G+44VIWVOcqwrwlqkiEv0crx6K4iZwACvADEh2qvxFTA1bgZgeJnc6hu1frTA7MkNB39l9CSVX2L+kneSR7X5O0/1/mR5dY6D5kigHTVfKvomrXE2L9B78KDyfLwoROCaQ+mozWWAafRfg+usapObjPz13kAkmXzxcf9zzgqVvVIkqe0t4yyNyyqUP9aJMFXjj+8WRuHeqcosuAAP75R4O/rajQ2o+rTbAlLRQUOzOxSm77zdEm/iRfYFPUmiwti+hy1zZ+ZpIJ1cRlp+JsR8owoL+zJKlA3F8GSkyRswkhK3SIfLDYTbRJmmXTFboCA9CGY2Smuo3pBqS3cVTQHobm5g5395VymoSpk8vpFqVoJhwj21CyKGkmTdZSvlYVgZkFPmVmaEeZDtJQtgrdXw4HW4S3cimfFrGsIc946/4uBimnjIinqsiq/6N3kueu8o5R0vd+TKrbLE5/O+DsveTEKVBBDxpI98fj+YaEnwcBIJxpLoqk0l2istTvB1CEEj+/lMSHKAre8KjpDmP/OViO+C/Y/IhkG6V7iQBxjHBAp6vul5ZA1sdN3jSHENVKW3LrtXmFuzsJkIGypNZ5KjetObH+dd3KbYlk4pdB6P8EZaCmhWSw2FJXPPT87XYWFcOLyBaXx0r+6OBMJuGEIj3CkvB6oc6XmPBl61SurlMWdFZ2LMJF8zvNzMz3cH1Gmq+4tGM/8qiTaVfjNHyDkK0kkTbhp6ZUEhpJ9xNWjKNqLZxRKo2fBEuGKZpzDDLSz6A8V23C23LaQgEezX/V86EPZiMAFX6JaoHFw7mgKrjV2WumhIF079MK9Krso7osjGeCmygMDt1AALXDnxbnF5540f/nYyRavJ6dQy8SbG7BfZPxbbiD8ESKzv8ewFKm7049yfennlPYT1XjSr+t0KFHOtd9W5b//JstNFzCxH7O6f0Ptx8gztRPVCCOVbklLHfFJl9EazHckVaAzqjONmiTRTHR7zYRNF02kRGXurf4H4BmnIPYeWVEb44U2OFiberQR5vrlZekOEvqMRmqx5SP+YemElCCXK9ZYv9phgacsn2+dWRwKFVA//C17IX/8IwJCJnVtNvNxrrFPhDnrhWHu3PQfxokYnqNjNVoW8ktCHlDUYxSk0KTYzq4IM9Kj+HZbphEcC1Wf5/SJ5gwgDV8TRz42+AbYaDwce1uc61l1rPyXtKyZ0TaTtw+ok0XYuTcaiitNrT3ae3JMYszp5vfRNyvycrqy3+rbSlReOLfTM7Of0+3CHII47YHBkGBi3ojHRHzmf0z/JPeW/1PwdY4ajPbjp9SjHIa1UJFovR68FPiv977r7eycSO5MAZPcV056jaOoJ/UqLZHVUCeTB3PHdhblT7iFM2VN3JuCuw95/SVEl6zvIMsOEM59Vy85GSSLEQ7S3P6S20PJ21UD38GFcjfaz6f4idzRlQDrxgEL0jclgWKfL+psouqNOnpyU/LTavsiB6LwTUYqXM7CKJlnzS5Dl62g5U2yxHEI4CejbZtsSrIobb5g/tANaJ/qJ9wkflR2epoqZYWh+IDQO9ic43+dVCbT14aMafUrWTz3y1NeEf8mCiaRfASZkGYH5Is08NXthD2zNo6B0N1GMclB3lhk8y036JM8atNU+0vEZBphKZmO/S6aRr4J2/sXsygpw4smNBk/5si+W+6H/HxxAoH3nFDkGdCuJeTMQwkuksewkP5dTF8Ruydc7na3mbbCNHT5v4PzxGWeFYh+NeHurql/ffIKf8NYN/gbTqfD/v1jbLPcGUKzF/FqfCX+GgubU0LJVopZkGJbRE4YffMA3UUZPkDHl4e9SKXY8z8wzecXXCXqXAqk6rli6mYaBaUxq/Z9TsQ4GO8URrGHWPZoPB/Jlq+S711ehjdmoqvNxWXBj71MYcjiHb5zz6JYNt+55xARh2/4oIWJ7bg4S0RMlbk7T57OfmPYmOHntI4PS5VIWPnhEly/Do5gFi4TQdaRQ4ONwg9SDYGtwxLRmWNEQMa10pE55fsp1hr7SPLNu3mnx06T4SYI1zpdx+Moc6D+k+8uDSeZTibKVDNXdChYXqGHmMd4vNcA2zmcjO0JssffE9J0nKyMhrsGFysXwHTrMg5u018VvmFbkPPnGsgN8+NKSOGzUTixPXC2IGcfjmd2enDRJq8gkiKlNVbdlq8E+ZCbpd51Uv0uud9O+KyzF9mhdAyx/vBn4DLz718ASID3ViqduoRKZeTBOZGocs9f79R7T135ZKnKAheZ2LLhpYeEA4ruGro5h6WNyNQ5aztxULtmbPfHpRSTbgaCKE56bpZR3Gl6QCCYKeKWjPGlg6ZNAJQJY2htF1IadnHg+WFzdD1jYhlRaooKcgnD08JWvmR3VDOKDYJoGljsUHbzerhpXy4nPvsckOyTbIKjDc0XXWk1u8nKxw8T0k7+JfVMTAdozersbxpcsNLkWe33X+YYbGTtgO+8elgj/e12ZY6UAI614ZeEAnrC+x6VDM9Lkc2LbyLGIOFZ3FlQnAWL5OLW2iO+jMs5/Wus4LVE3dqLUTE1wOM55UmMdH+uuEUP8RmmKcKeOlJmwXf0EqzZTf2yS0ymwuVe/2iClT1RTx5lDF2A5pu2NsplQTbBQFN7kXNqiIbvHmYtGZGZaEsP/BzOVHanBJPjHNR54FTxoo4/wybHjU8/O4FuD2dwaAivVpZb9koYPbfNJXW3uFzNuP9yaxxabGMzT1w+3qwYXjk5D1DCfBBCV1vgf5nW3Oto2b5MJcQyfsn9KoCt7qzuBWCJ+U8fbjxxEOzsr3z5kzUH31H/mhg5oA1N/s+E0f+0RggPYCsx69ZS+RMGa3Gb+lXJ70L1cfUCvFASlM8/bHQ4ad1NH8Js4OTllDFhGUwxyD5q/cNxclWfrRFdxfxosRT/CdCPbbBaAxRoHU6eQHKu0x67+OZ8S4Y+tvP8yEvow+CNrhM8oxFoNZo+LU6KNb6a7TWTe5Fx8f0nbFtaRpSw7kvS7tk5KDrLraFdx1aabYs3t0XIxAec6RFnL5tTEwa+Lc/2H91LbJ8oAGIrR3RNdOLsBhh0Z25DJp5dhWy2gp5OC4In3OP1a4RH6u1bNbb39bbelqXzLPrPZ10wZN+9Ki+lKoWgRr2dD+eSQYZ6hzCLkOqu1eUrebYx5AOwlr3HxuJuiLbLrRKmN0t5t6mnJATel7UV+Yz2DBgfcTXC5rYFNsTHSgF69fJ+GHyT98KP20/BPWSi36xbnA9hnkT9+4egDW4CYq2Lz4JrbEXoi21I0VkGX+tzyxrgwPDMIvdgYYI+c2K8P53wxDALIA6LkMtMaxHMJuYd/p+M9d17qLb9plFY2dybSs0SurOjkrSDC0/+lASt1dg7XUpafr1XQxz6c6UpRV5rK8Bj2B+eLIDJuNTEeM7BCP7U4usXnvws2fiSTajeFMK5PjJ2NIpIC8kt2cFhrUkO8QWFF8ERoA5U+muoGtX2SLpJ2PM5iZMd6oNfNMuUEUSPl+ih0KWLVVQVnu8vG5k3piW6b8IBldkF1n16GqmJpsO4Pj0jA9bI4qGWhmYHxTw3jeRyKN4aywCowgeEd/7DoThAM0EN3iLR8m+PNWRXojfwgtLn6Aa1v/Ya64Co3LuTt8r8ZX+bksh4kDUosZwcrNe4rUVnjGq15Rgw7AMGpVm1vm7oaFQaGgqNiJcIKorI5YD5bq1PIwMv0l/d/6QHhR1AzLzKn8dCEDnngvKLt2Le9x6jcBHdM27j1I9jJQqi+5pVZosNc9mODiJrNZwmQT6E2fjcjxhmGB3WzRGtQcWlSHlR3zIVf6pwQwm507oNaXQOfBI+6YFezJjGqy4yzvOjgclFomKP1gERSxySHjI9MrIFnjgbq2jzedaH4N5RCYDXAKuHxpYSxob8Z4LljOmkS8GdTTjQsaSgeuKlmWfjE4ZCw2qEl+74kCqca09VD2cOkMWt36WdWwkKwn8W2xR0a2O0Cyu2rIcQe3KduynGbscOoNb909byNidlkSBtl9W7BYuyvJi3qaDOwWxa8rPHkjn3vB0vRxXbK4090lZMVneYgwY9QUvyCMzNH/DAIk0fT0JxoC4zGFWk6+5un7NdfPQS210ZLqEXoVBxObdVbfxAPsDziM6HYz5u5y4c33dnbNc0nHklf0XMngjDVegKFhKGDJIESaGS+mB1LttkQzLFcQSA0fjeRskJdaAvhBe3nUj9qOjvlpJmxrVqI52zW9IGHZsHKBZgF3QMYmu/0DrtDa5ommIs7dSp9+O7lRf6lXRuUSm+FneQLXH6aicqJ106yOdPAsZ/EyEtHuRmlSopRztRFCjAU5AwGHrxfO/f67IgSIsaL7b0xQ5eHn9guJR9YKbVj2sZqh4LA6x7MBQeJCNiG8C63SHO4py1xNmWXWVGQiCWHAHWP4TcPMGS3VvAUO/THzkK9mFixVDiof+DeTkDeL9dY6M9JHUXB/Y1blyYxxGa1OOAzXMAiIga6W4krTCj8asyPE/WJZpnbo2E59GHEhPhTWO+OpQUf9uJyg655kpLAd2M1kwxesbjW/wZgK7mbj3Wdldkb/Wzq2FAyiNJojVhJlMFK1CmUPzWRszQ7MNmOBxXDRmf89noBM5MUq8x5ehsLchobJOT6tXzXJtvoI2utGHeMbM18cCmx4dHuD76/1A4yadriuFSPjRljYFlt41Rrt0IBVO3QUIIZZP3dhPl8zFJxeSzGAsZFOnfNe0XSVY+qqB2/wpaSJLt4cH7tPHUrvHPDkQue87byhYdtfD0mEXbVSE8tEHzYFHch1puRmTjo5j9AOd1I9n+ySBcXzQdf3pG9bA/uFTgDJgcYQXDuMkYbylsmlGDsl+E87+/nmSDhRZocjRE4ya/ZO/BKB0jdSN6fOLrALs336WzEqWRrCfyejxQg6fT4Pzkhu1wwG09Boo+KLoFhaycGh97VqYlKLyJVvR3QE3xIorzcOgbGwmJoMTARcwVy3BKlEi5G0Apsnjo6qmnd7Jjhgc8T0Hfo29Wz5gSoBTfedv00F+TuL+0kEKfesE2AA/4Rbm1pHAIHyL8WgcUXRmJCJiWQMSmKNQi2AjuSoUax553j8Vt2wivcNeihfVleRm3vR1xMP0d3z521l0Q3KJgmKHVjxCSe/7zDdirZeT3lD91JeaboTFF8C6ShZMBkehpqKZ5igJpB/fC6Ky4Xz7dvZnYVZBoXzBokhbjTlWIWQ2WiektUsNvZYY7Djq57aIdlmezL15KubQTFSKfYv8YAsgelY+Ews4cI/KgPTquGK3Myz+f1mchvw9RkP/IYKDYspD8yuJnx8CjqlSlj5867tpaG5R55Oae7J86SkZuTygBGcIC1J18WTeK0+k5Y8h/EJYvq51udpnidTzTMR2k3rHpmcDKe8SD+2qRUhjPKtrhbPInhm+Jd4yypQfXGSZ1YOwQ7aYaJauU1a9GynOx9eSmuqEXNrHtQ23dpILziRMuWFDSJcHxEpHmBvRz3mOXBP3vc2JUDkZ4jfSbgMQKlBZ0naQIApRESPGDVB/mLeWNHEz9myjq1kDiRzHGZn7dr58A06vvXFd9Y/b3J/vih415jrE3QbNfcBZjkF6ulMsFP/NhaMb+cOo/sa4yVnkideieupREX6Qy8OBkZiOcUDAyZaxuoPT6cZBdCdfJ6CsUPzQV/wy8lfBl79ObQ1tOs8ZQ065y9roptV/j7chpr7Ag5Wn5RVv+P7EH0iPFW96TzwGBg4NYIygpgIsQOw1iaBQT01x5m99yLeMvlYTCqQ1KUnjgKLz+zaJPGR9acCZCD43SyTnJ4OW7ZCfgykOieB7HXasiZ0thpf28Y6CGJMfHoleH9mU+x2tgMwAxXa901YMyDFygFdMiuOf+a5paig3A1VIU40WH8vcC/z5uKmr+suZ2RsEPE9R4Kr8+sQ7ibJB283w2+cAENkTkro+M89ajbb10VMWWJDwcfFol8qpizoFGARlWEnV88Se0ZNT8LnZqIBk3m65tErnCVJDfY+OuvwKt2ErdptmZzNQUzwZmrBIyqqDqIWvBANAYe+37KJLLC7G08rONgtzp92FdYGhC/cWFYrMw1fjCZ3g0vALCBu6N1uv7IRc2ihanQ+YlwnaYlpfMyQLvw7T7T2SbGKO/svoQbmYR5AduSBgKhn4HaY07TKFsCSZCGy/05n5BLcdkF6X62LyZtQcvpT40pZDYy0KROgfjflwtoFb+k08JlHtmu23ImiMmw7g819gwJkUBk8TH75ykQTIlpu2Y1gISu+KDP25Bkzbjv9Cbfdc6wfel/5t5yZr3c3w5NlZ+gBYdVfEldrd0nYhfqWjWtk15NDhixbUeVYu5CZYlQ8JOSRZxsr18nRGJEhvCy6ODusVJ2dOTYSeNMZyNDLCHHUIRLdgKAt12oCPGpKOJ9ZE1XgFQWX3V9DlBy7sdLVMC7qwkL6ncxGUlAQ3zSx8r2HHhpcf0RhLi3S0/oeqxxLxnJ+AJHX4sKJ5a1RlORoD+y2Zp7ZJV8LWmHb3DrOWVmoxG1lqhv+pbmTEiYttl1rilw3WvaPcMu9l8JnudngvNyXY4CA7NWhYeUgPuKN7YP7k+N4JsTIsNUFNJk7bKyjqs+EYETSmQ+dsbj9VmjkVXocPDHOkztD4kNLNzianX6fs/aYpdmFuu/qCdvvy+l8VpOxvaXnexggGBE5b8ZXKYqWA8wVaRks0d4jN0FXfY2hQarLE3vc3qxYol6ScbRBNgfrh0cuHkXW09ZtFhKu9MFVoW4rZcUQuNEPlb9Wcp74uJh8CgwofXvfMfUUhAl6FzABdDOiZkl6L8/6xo4bEeaJu/DGvqKSnahfrR7+EeR96OJTucUjEGo2C8M3rqNsPRqus7qWVTLU4dVI74x+lReFKwTeAnSbfZFXzGIL0ahT8/RraCtXjjIFrydbLHzlSPS2qMQ/6rE30XyUhcLvOkWV0ODL7530lYoIw35P7pet+xrlmdJQ4r6GcFaIxIxt/215kqpJsrt2PRLd2Fk1D+BLtIjdBVMpBtef7xmU09/Xcn93WwBtcBFuHOPoCkNVGv5ea39YtSW0iW7KY6V7+P4t5hVxo48wVEzmI9S+EXLAntlraaEinTeOKd12TDDQLPIoxID9LCGut2sMRLnB/RBdmQ+xe3F3MTFab+xvIXFnQlkv3kyqVF9wKIrAo83mY9m1bKfs01HNRuc63Qb8bvfUi4+s54VXkLr6PfZCzLkmm/a8xtr0ndX+fgDwugFiDhby+xFCrFBDXih6l0l/yGobLTvx7VIFsch9YPv/rQZQd4ikVh9mNXS8pSGh8i1PU6K302fwqFGagvt3PDNHqOVO16GQiqCRK71rhDDdha2VU50ms4rtDe7Np8a6hGh6ncFbHsyL++FB4fTbJWkjvvpSuIYqVk8rn6ie40gwq9vojY6lfza9Msy8Katal7v8Pzne+ijIaJUvt7//QAnCKhxI0c3UnpXOVFG5Ax8G9FIeb0PXdbWJ9CWl3hBRH9lklxM8LF5nPhHWsIRaAOcoUORCVHVJ7dGnfQn1ahQ4r4gqQHIDTt5Q2xMx8GaXGjSCPYyh0B6zNx0Pxf/u4vEBVKUkx4PfIo8PUqjzeQbJW0u0JGgPgBuLm5eS+/WhB3Ra43F/PabhDsj2qGbPYr+oliBpqYdjFVDKj8e0WjnvR9aRW7b5vXw8wVmNereTeKFfecbrdj8cxNjUp5vIC/BlxW3e9YNS4GPorvWrWPycE5mEIzwE06KF4tIX9UxMgf8T2KNGqwmkxLHIDYMo7wzsHUUtuCLLACNbeq9HjTw22oAq6V+kJ3I00/+K5o7DuuwAOOkX7CQYEtcnRDzgbd+RtN1DypseBrFFaU4k45hpe2WkGuhVbygzLN7lbrSLFcLfJmVK6E2yB/r50TiXdTVHA17K4Odo+JxnA33gsvP/TCratrBwUdmGRdznqZOtBtoH0F/OgxJ/m8zpcNdFqNCqdBUIJljn91iuxOA7ZugjOb9HMTCbUWJApcq5T66oMP48Z+uOXoa3DG1yX09GrZETMPg11egq0McLkGQpjj41Hs0mNM7Pi9b6ETsjnmzwtlKAlBZistR1yLa6B97Irk4T95ezsZYCsAFBKYZYyioyVp9O92jHnAv9mU2PuxRQj+W+G5FFASVeg60w9bYUUfGcT6b5TkEryhYeM9LAbK6C4fA1VDEbT6QM6CnWnvUmqbcje/7RQ2WqUjfBaIkmvo60rsUDgPFxtHgm2NgBcwJhhY/f6H5+c9yQpdGhP9MC8KD5KBOiDJJi3kl6nyZ0abFEhl+ogSuyxu3zcCbgxNN8+378tyPkA5kqnnczslasZQfVlcQHwbwNVpiyZ9RQc8vcCuQuqjh8FQ8Rqtr9x4Oq2Zubwx74j5JNjlCj0LqUu9MVq3w3vdYBBEmNaPAry2d5OA13P2rzgk2YfzClCVw/2QrzUUNQdluhJ1leCiOYeKW7D23V0f6/jOI+t70Nccjak8fDBKTJF4x+hjziqmYiuZPlqzBqqPNNNYMcjiAfupKNqTTjGmxxwYVMHPx5rRSM2DKi+5zvWe4RJUSVyZwwCJFKZ85bdJpJ5IIOdTWtBoWTH0nh47yg71j3qDxW4KDS0Zg70fHtjcGRS+4hcTWOTReXhbyLdyZvDDeVlbIe3lMBS4sBfHGdZ8CZptQW2GlIbEVLImvzwr6+LINlMMeQFdkF495IC1dOp/rDroTokLgpOBybJ6/+lyHIRizjw3E0BSIhJsyDiRbIHAc2vMNFKcqHUshixSxQPgYd3VJtZQB5UTLGBonc4OA4ZHEPDQdinbzqCIjyIiVHtXe1zu8dX9DmC9DG2VJL6V7C9BQzCBP1sHJoFYZp8ltXdzmoOfxoJs8SiOKk+jW2hY17/W184DbYYxd5reINrnTG2rReNA+6AM5VUtf7P9BjHpVl7s+ShW9nxCazvueulEBnK+s+ZCML1Wl27doY5LDYmG/aYVZCdb/h8UnB1OD+Q1txL5X/BeB72doD8AvB2vDh4YFQNXUL5vrs9up/GiI4M9FpCDrlY1G6Ueo9pF3jLyO9gUZ5fOnLSujLoczwTQ/b4KriEPkH98ortLOR6/T8TWOp7J+hdxk5wEwvSD7W+loadW6VrSkYuqbPeMSf2Y0bdlLsNPsSwHD6XJemdCq1pfNrb0bVu8k3DK4v0aRA9eBEEjkDZD/LscmfwBksJwwr6Bdf22r7UouU9oZr5dULsnnI5sAcqNEC3Ela2nZ9VqIymq9SOlUZdr/o+LmMLhyTPilJIIPtYsetVb/0fIfDcPbX40LKdyEGgBB/pjlLkgZ2Ik7QZ50+FyBAYcL8xmkEKmlG5dHGUOSCzafvIdWx5jOBgPDKdPMwCeXn/0P+Y1Fsb+yIOchdHdTGPDDgvXgQtSqJogmdTGtQaIrLeqYgUwgQLiR0oyOxZBoAVLhWlxvAkLsuaxwurQP1Kg5DyYxuEleEf06skjujoylLETlyMqenSt5/5hu/TNGyWfE32ZQ1mBB7yEsedhAVnTYZJufToTWxwuhXT5iFSSJGNpKg8Jc5MEkpFiIhzl2OowPHES6gksVgggnA/BqkFy2sjSvBUYKAWO+deT9Qm0VM9AqKmEFd4atIDBp1UmxPfYjR68pCbm2Pbuym3aC4z8ryFqdl3Y6U2rHRpWaJMLkrESA8HxDGDWixWj9EPHieHOZKMrL8sZSO4pzFMPzHdRBh/rd7pWQ381T2lD2aqDi1FiuV0wpwjAmm+KEopHdpRkDYGRBPz9u9GB0LSlDouLp5htg08pwOlSOgi1f0fg+E0e3rceAUyFxxuLyJDkRBPDSqbQXEXbpfIpqGECBDwQNLn7smRKkewlTUkOxK9PxN/4S5cnt96kUSaXW7H9ZOKAZS63en/hTJ3J2BUhW7maLwNqVSxKY6oxsoy4mswOkVEZEWbVuxndQZp7kvFNzmAHX81g9v4HfxUPT0tSgA6Synhv9qrM+vMSZzsnNTlN/ysAdsLSxKFBHmqwh+Tyn6BWlggYF6v+2lAwdPczqVH315MT/Da4X5p2Zle9L5hGCl7eou7gKeJtjzGqpYt3aqymf3MQpAFO9RFHwTHW8D+vkSgdzd2Jt+zY/jzxAKtJ9bwrpa35FwgB/WdpUScZmFEcJd0tMhm8DR4xuXP2HnU1KSKI4LHSUswgYaFTs/TS7PDFtMDbGX0ILEQwr3LvOlo38PAEbPjeVKV5yzRe5eHpk9Nvd+gFslS3ZJ86Md4Psu2O1R7LdgQrk+0cV2ybXhZvswlZBN+MKfv/XlXNbmGvd6BrOAsyfsSKUj/2RQvi/BU5v66Rng7aXoxJWxzq5kl1uzNJWVXYh9+sDZwHaDFhOAwtVgTELlM+WBw4EDbP5z/JUeemtYu2P9Pqv/7Tx13YoSiFwJTONlX2zvl2hNuCIoPzCXX7Iu/kjAI8TNZSKRK3Ta6J4Yhk6/qVD/wefhXHRwpw1p8zuoJh6JpYpjwSgyJnOZh8+O78Hi51ymnZj7LGUuV1KNlSWwnDg5rlmChuw/ikx0kD+1RG36XFOPbeMyA1e6y9uTsyKHvH2RwMbOWejAN4H76Y8al34079KCC9jdSQlgTA3JCZ3oHGMxgLDPQrWhhPMgmgtrSINpyrKta8HvRpdKw5H8BUxCFnccBLaVY9NeSOsJGQhZGxGy/Wu1zjsa9AvHfR6jxP2bCsUzdN/6g6Gktnwv0e0LeXshfVCtk50lm0+fUBxXvbJYZrYUOpbHJ8S1jJRGvXtMZ9SHVHho/nrnMyQqxA8+/6WVzlGv3zgMNr3qSVxXUaO1fbCRzFOlwL4ZL4gHp/a33FA4SATN1Ysf9HpMondsxPv8xN0n81pLFwQIb6RvlGP18Wy2xrvANCwEzWlu8qlWy+0JMRaEzwB+zcy3tmTKc/fC0x4C+UfVYxXMD4jKQ6DS3URsL5CMmhrwqG5/kiiSI0n1racFMRNb0+OrFe9zxv8MgJia/0qoXUaYHzkN23ag3FhYcERH6anklJPM6l0r04ObWIrvz3WCuJl4TdczkHxX+tlkjS7ch2ThOO6AFczba8OSx4sBf++jQhiBiCNkUnzVZXR3nYtiW17Zclm+cNpt6z+4WDBaC98jCZcRmUf6l6vruRnC3JjMVZyCJCsuKAc5T8hGS23XaLzXGyMcLWic5gTH1JYu3xgI3yduoc0GOna+y1326dOZxaDgPO1So+SJ1ZAYUpr/RygQPfjczQe1QRYNMSIpQnz73mzk60hlzrCUzWuKF1zqlvuA7L30GRsAxpJyQfojNsrzmY+/g6OYyD1B3B94S6W47FUl6JCAyRshyj5MA5Su18YykdxXzLL7rmV6hXpSAKxOfohztZuGv7ECw1GOzVm4//61FLnRRGSi4hOZboiQIlrG5y+6V8co8k5wT3YoWnYsrQQsrK0NasBHqkojxzjV8g3gHlmGYv/knjEaX388JMz65kD+vT4bvxW5/N9ppUMuoAVa+8NuGdrCjBd/NTvSVZEfPQj9d1tVZR+4w1Ha+PrS1HsWZ39oBUSd4BiIrWnjHaaOe/Exilb813BdsiUToFGV0GxuSdijdxdAD5cWSyGx7WJSnQQso33bPDJKIR1b7yxHssBTSSZN495UcEYza0IrTnxYTN7/9mOC/1OpVkQb6Wg2kqpudqxpVfCP9s5wA1VdqG9zSxOEith5sxHOIeOPtkJ0oREKTGeM+jImX1jsvBrBI1V/5DB8y4ApUlMk4o8NRbnTX0VQhXMbXjhogyX9wBMIe1U3y5THwqEY2rue/cHlIX9nKzzXhRSswdR5StGszfpyh9CJojqE+IOLtKzhA6lWg7w7seomncovNOo1GlktJHHJy7ZYootoBzyKD0dP5WlWoNvUnPrR+HtG8Q3c/SGTjeMSutl0YCaC4KgtkZ1nLmhWZzGuWSGkwEDKPAlM93vlCRj1HiG1eDE5WU9x9V7RiaGLW8X0BoVz9cKJenw4/D/knGldxzRAC3fcX99GpHlNtQnsyEYToBke/1l2iVFQK9rS9TGeZOc54BJtu/xBOpffY8Q4WCqhd2k0O6PsfOImnNQZe793HQUPJOIr7fNYeZRG0eo8e7VyDmeixA1XOeqWmFXShKj96p6S/w545bh4b1T3dbQQeGtLLD+mAbNl8pF5VEXZqF0lFsmf1oPdERbeY+ZMXrS+gFpxmwV997GMPg+VjI55b9jB49qBOJFfehfZxjU+2WHqLqyPO253by7+Y8KW6qghGslvK4IifMI/dbIjddBywric2TKW7yINgtj6TF/3kzKF8iKhCSf70OWE9oCNH0VXQjIRo4Vdnre9bu5qng9JCHOUbG8NaoJJLw0yDMrCPY5Y4+iA0FIvs3rFiT+b0nGU25ebPN/QMI/qRB3vlJvlsuobccKb5CZxmhBLA4QVMbQ92qa8jrSWqbVp5CtPXJSTXJS0jqv8dpH0+CYJn3CxotwXFE1cKuZIJHE/e4KBU6pHjok6DcIzMOX2J2CCmp5arAA8ZJjAgvnSbx9Byko7i/yE7l10HlMDBnIqcm+YFk4PhHWcN8ncLV3C2n32ldZtoPjEgQBTdbFxsj6olyMlg1AMwD56QCQOIagRx6hJRn7zcLV+dTfpHzgfahlts0EImfFFieWYhoWWaudutyImkYE2REXrOYfdaw9oR4J7eh9++1LWaeLDpmgoUd80rDRMWos4ysonIbt7IPwXW2KJajliO1La4WNM/8ARnRqOgp3pqhebJohG/NFxbTuRHl8j+XRfzlAbZ30FxAk/wza1gfNWbA3Q0Am2eEJUsW7WKrMwB34WWv1+On5Lw8gcEWym7xi0HyTht0bJunF8xmSngbkggDVb2kbzjXvnBMzt7rwVNNBp8c0szz/slsJ57ijUXyscUEhvP4nq1Q+6sNspf3FO2lIAGR6mB+C5mdHvXY/+Pw7Y4Ci4ghYrnfSRmftyo5m0vOSCogZCfa5o9hZH02dxm3gvvkapE4TWSszCBgYb280NZp6yaJTd8rQfnSl7/KS6oFhyGJoX9V8aPcsXHqmn2nGiNQVMioITvcPSo/u60vISoO0TMwkcfg80WzfBU17YOjKOBOqS307CmU7d+W2wYXuDUlCEqc0EFNN/NoMVNHBAriB6ACPMzrCK00lbLSAYhdzX4Rzt0XVlzDIWzcAlpAmKk8NCoBZHt/0gqY92x9ojbhERlf2SHWD4wJEgWqAG2tHH0ZT9CkBFw+4nZPlrNQ64QsCtuJVE6+N5CrRjcRMM43o4idTZDRAuGBe0/7whauGhGdrLjNXsYRbdbbioA4lJGwU2z5ebGkzZEkfK8gkiA+IwhrkJyDU/ryEqXwxqobfoYJGiLSYHKHYBx5uNl/gh+S4wu8nwYt5kaZ4EHLg9FA4TCSdcUp8LNj9j5rvho6Yhfam813YzSMxYGMGih7HFtFthVXrnOKAfmUyTVfxmqRTtoxHX3bVp2/OE+u7AA3MSk6uu8R8SICVHyLQP+hOpqckGVYoNjEJiDkyLN6BtODZI7KbCoUYBYn6FIuWDmPMT38964jFeB4bM957cT8ff2xdsifS5sN5ZZDoi6CssEJvSU9tWdb7pushfxxJgKfzkPFN8J08AAFsjeaPC0MRgNytWF/5plcWcJX2kcuXlxXbLM5F8lrNtEhF0cqolnnYHcuJTdnTPQh5R81zxStSEBgWkFfnGcPsms0QCp1CMdYAbwhfw5S/FYV3pavzQLfvKCXkT1p5ItVWrKW1rDzGTqhzuXz6A8dfMNtMcmMxAPpYY6tc+EHe7lghReWhsz/gk0nxU22XchsW/UHENTvY/EexyfogCqB8wfmbOM47X3TJdReNJYlVIxRgh1Ic6t5+ixzWblcqBXZmsMKC1hvcp95ia1Sq17b84uFSomS1Rl+6j61JGEwa7u8JZ3b3d+xKj3dd94mCR1NR4tc971QDO5bpEvFNQMZ7Ug9MfMYJrBFNrA4FaD/Gf8nGGoRepsHXJl5xkLoi7/exmmoGRo6TFTvE72biPQV9vaCUCiwwxk0UI68vd3Ymv4SHJVciSl78FaFMcIUGa8cS5f7oCk5SldCqhq4A6DP1nZCJ4q6lFVWLBoDsU7jfL8BBDax0bILFurqqYOoyAwj5qtKo3yqPfq1RAVC7yzubLv27XAqt9py1pXzS2WQZI3Ep4kTlLROSrPi0A/8e8eISZTAH3JZkB9FTWr+/neqFK9E49nzgM/5bejVeCz7Mf+2dN6P1xjGJAAAAAA";

// --- Notifications push (Web Push) ---
// Clé PUBLIQUE VAPID (non secrète). À remplacer par la tienne si tu régénères la paire.
// Flux iCal des moments jeux (fonction serverless api/calendar.js).
// Le jeton doit correspondre à la variable CALENDAR_TOKEN configurée sur Vercel.
const CALENDAR_FEED_URL = "https://aladj.fr/api/calendar?k=51d278fd6d41a8632b8065ceb56ece3c";

// Palette de couleurs de jeu (pions/plateaux). label = nom affiché, hex = pastille.
const GAME_COLORS = [
  { key: "rouge",   label: "Rouge",   hex: "#D64545" },
  { key: "bleu",    label: "Bleu",    hex: "#2F6FB3" },
  { key: "vert",    label: "Vert",    hex: "#3B9B5B" },
  { key: "jaune",   label: "Jaune",   hex: "#E8B21C" },
  { key: "orange",  label: "Orange",  hex: "#E08A1E" },
  { key: "violet",  label: "Violet",  hex: "#7E4FA0" },
  { key: "rose",    label: "Rose",    hex: "#D96BA0" },
  { key: "noir",    label: "Noir",    hex: "#2B2B2B" },
  { key: "blanc",   label: "Blanc",   hex: "#F3EFE6" },
  { key: "gris",    label: "Gris",    hex: "#9AA0A6" },
  { key: "marron",  label: "Marron",  hex: "#8A5A2B" },
  { key: "turquoise", label: "Turquoise", hex: "#1FA8A0" },
];
const colorByKey = (k) => GAME_COLORS.find((c) => c.key === k) || null;

/* =============================================================================
   BADGES — calculés en direct à partir des données déjà chargées.
   8 paliers par badge ; seul le plus haut atteint est affiché.
   ============================================================================= */
const TIER_NAMES = ["Novice", "Apprenti", "Aventurier", "Champion", "Héros", "Maître", "Légende", "Divinité"];
const TIER_COLORS = ["#A9714B", "#8FA3AD", "#E8A317", "#1E8A8A", "#2F6FB3", "#6B3A7A", "#B5283A", "#1A3A5C"];
const BADGE_DEFS = [
  { key: "joueur",      emoji: "🎲", label: "Joueur",        unit: "parties jouées",                 thresholds: [10, 50, 100, 200, 500, 1000, 5000, 10000] },
  { key: "vainqueur",   emoji: "🏆", label: "Vainqueur",     unit: "victoires",                      thresholds: [10, 50, 100, 500, 1000, 2500, 5000, 10000] },
  { key: "champion",    emoji: "👑", label: "Multi-champion", unit: "titres de champion détenus",    thresholds: [5, 10, 25, 50, 100, 250, 500, 1000], dynamic: true },
  { key: "serie",       emoji: "🔥", label: "Série dorée",   unit: "victoires d'affilée (record)",   thresholds: [3, 5, 10, 20, 35, 50, 75, 100] },
  { key: "explorateur", emoji: "🧭", label: "Explorateur",   unit: "jeux différents joués",          thresholds: [10, 50, 100, 200, 500, 1000, 2500, 5000] },
  { key: "marathon",    emoji: "⏱️", label: "Marathonien",   unit: "parties de plus de 3 h",         thresholds: [1, 5, 10, 25, 50, 100, 200, 500] },
  { key: "pilier",      emoji: "📅", label: "Pilier des moments", unit: "moments jeux vécus",        thresholds: [5, 10, 50, 100, 250, 500, 1000, 5000] },
  { key: "sociable",    emoji: "🤝", label: "Sociable",      unit: "partenaires de jeu différents",  thresholds: [5, 10, 15, 20, 35, 50, 75, 100] },
  { key: "ludo",        emoji: "📚", label: "Ludothécaire",  unit: "jeux et extensions possédés",    thresholds: [10, 25, 50, 100, 500, 1000, 2000, 5000] },
  { key: "critique",    emoji: "⭐", label: "Critique",      unit: "jeux notés",                     thresholds: [10, 50, 100, 250, 500, 1000, 2000, 5000] },
  { key: "plume",       emoji: "✍️", label: "Plume",         unit: "commentaires écrits",            thresholds: [5, 10, 25, 50, 100, 250, 500, 1000] },
  { key: "batisseur",   emoji: "🛠️", label: "Bâtisseur",     unit: "fiches de jeux créées",          thresholds: [5, 10, 50, 100, 250, 500, 1000, 2000] },
];

// Compte, pour un membre, la valeur de chaque badge à partir des données du site.
function computeBadgeCounts(uid, { plays, events, games, upcoming, beltByGame }) {
  const mine = (plays || [])
    .filter((pl) => pl.participants.some((pt) => pt.userId === uid && pt.confirmed !== false))
    .sort((a, b) => new Date(a.playedAt) - new Date(b.playedAt) || (a.occurrence || 1) - (b.occurrence || 1));
  const wins = mine.filter((pl) => pl.participants.some((pt) => pt.userId === uid && pt.isWinner && pt.confirmed !== false));
  let streak = 0, bestStreak = 0;
  mine.forEach((pl) => {
    const won = pl.participants.some((pt) => pt.userId === uid && pt.isWinner && pt.confirmed !== false);
    streak = won ? streak + 1 : 0;
    if (streak > bestStreak) bestStreak = streak;
  });
  const partners = new Set();
  mine.forEach((pl) => pl.participants.forEach((pt) => { if (pt.userId && pt.userId !== uid && pt.confirmed !== false) partners.add(pt.userId); }));
  const today = new Date().toISOString().slice(0, 10);
  let ownedExt = 0;
  (games || []).forEach((g) => (g.extensions || []).forEach((x) => { if ((x.ownerIds || []).includes(uid)) ownedExt++; }));
  let comments = 0;
  (games || []).forEach((g) => (g.comments || []).forEach((c) => { if (c.authorId === uid) comments++; }));
  (events || []).forEach((e) => (e.comments || []).forEach((c) => { if (c.authorId === uid) comments++; }));
  (upcoming || []).forEach((u) => (u.comments || []).forEach((c) => { if (c.authorId === uid) comments++; }));
  return {
    joueur: mine.length,
    vainqueur: wins.length,
    champion: Object.values(beltByGame || {}).filter((b) => (b.winners || []).some((w) => w.userId === uid)).length,
    serie: bestStreak,
    explorateur: new Set(mine.map((pl) => pl.gameId)).size,
    marathon: mine.filter((pl) => (pl.durationSeconds || 0) > 3 * 3600).length,
    pilier: (events || []).filter((e) => e.date && e.date <= today && (e.players || []).some((p) => p.id === uid)).length,
    sociable: partners.size,
    ludo: (games || []).filter((g) => (g.ownerIds || []).includes(uid)).length + ownedExt,
    critique: (games || []).filter((g) => g.ratings && g.ratings[uid] != null).length,
    plume: comments,
    batisseur: (games || []).filter((g) => g.ownerId === uid).length + (upcoming || []).filter((x) => x.createdBy === uid).length,
  };
}

// Badges d'un membre : pour chaque définition, palier atteint (0 = pas encore) + progression.
function badgesFor(uid, data) {
  const counts = computeBadgeCounts(uid, data);
  return BADGE_DEFS.map((def) => {
    const count = counts[def.key] || 0;
    let tier = 0;
    def.thresholds.forEach((t) => { if (count >= t) tier++; });
    const next = tier < 8 ? def.thresholds[tier] : null;
    return { def, count, tier, next };
  });
}

const VAPID_PUBLIC_KEY = "BEsHP5Lx1BjGjJxeO9upUgkuSUR6dXqwjUHhb330zTmexkwZgCYmIx4sgJKM-eJmzpVdwikuk1L_wmeVBPkbkOE";
function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

const C = {
  navy: "#1A3A5C", navyDeep: "#12293f", teal: "#1E8A8A", amber: "#E8A317",
  red: "#B5283A", purple: "#6B3A7A", cream: "#FBF7EF", paper: "#FFFEFB", ink: "#22303C",
};


// Adresse e-mail de l'association
const ASSO_EMAIL = "aladj50200@gmail.com";

// Groupes Signal de l'association (lien d'invitation + description)
const SIGNAL_GROUPS = [
  { name: "Organisation jeux", color: "#1E8A8A", icon: Calendar,
    desc: "Pour organiser et s'inscrire aux moments jeux de l'association.",
    url: "https://signal.group/#CjQKIBiXldDw1Py1MFhQA8ksSS6NhCItoUDOjzN13FH2-MtoEhCwJT2eW-qLyOg4bKiEnLw3" },
  { name: "Blabla", color: "#6B3A7A", icon: Heart,
    desc: "Pour nos discussions informelles, papoter et partager entre membres.",
    url: "https://signal.group/#CjQKIOeZ5C6Pezkiq6idGK_KNZDTsLvRYQbQeO9kg3CNrilxEhCiajWWCRHgI-Fe19To7xOj" },
  { name: "Jeux en ligne", color: "#6B3A7A", icon: Globe,
    desc: "Pour nos soirées jeux en ligne sur Board Game Arena.",
    url: "https://signal.group/#CjQKIDrh0Erb7vmLuqhbBcjelvyRNlakSz8S0DWuwYzbY9PMEhCa0Qkdic8YD72P2HPBjUVK" },
];

/* ---------- Utilitaires ---------- */
const slug = (s) => (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

// Normalise un nom de jeu pour comparer (minuscules, sans accents ni ponctuation/espaces).
const normGameName = (s) => (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");

// Prix de location = 10% du prix neuf, arrondi au 0,5 € supérieur.
function rentalPrice(newPrice) {
  if (!newPrice || newPrice <= 0) return null;
  const tenth = newPrice * 0.10;
  return Math.ceil(tenth * 2) / 2; // arrondi au 0,5 supérieur
}
// Formate un nombre d'euros en français (ex. 2,5 €)
const fmtEuro = (n) => `${Number(n).toFixed(2).replace(/\.?0+$/, "").replace(".", ",")} €`;
// Cherche les jeux existants dont le nom est identique ou très proche du nom saisi.
function findSimilarGames(games, name) {
  const n = normGameName(name);
  if (n.length < 3) return [];
  return games.filter((g) => {
    const gn = normGameName(g.name);
    return gn === n || gn.includes(n) || n.includes(gn);
  });
}

const FR_DAYS = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
const FR_MONTHS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
function formatDateFr(iso) {
  if (!iso) return "";
  const d = new Date(iso + "T00:00:00");
  return `${FR_DAYS[d.getDay()]} ${d.getDate()} ${FR_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}
function formatDateShort(iso) {
  if (!iso) return "";
  const d = new Date(iso + "T00:00:00");
  return `${d.getDate()} ${FR_MONTHS[d.getMonth()].slice(0, 4)}.`;
}
// "il y a X minutes / heures / jours" à partir d'un timestamp ISO complet
function timeAgoFr(iso) {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "à l'instant";
  if (min < 60) return `il y a ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `il y a ${h} h`;
  const j = Math.floor(h / 24);
  if (j < 7) return `il y a ${j} jour${j > 1 ? "s" : ""}`;
  const sem = Math.floor(j / 7);
  if (sem < 5) return `il y a ${sem} sem.`;
  const mois = Math.floor(j / 30);
  return `il y a ${mois} mois`;
}

/* Liste par defaut des mecaniques : sert de secours tant que la table
   mechanic_suggestions (geree par les admins) n'est pas remplie, et de base
   pour son initialisation automatique a la premiere ouverture du panneau admin. */
const DEFAULT_MECHANIC_SUGGESTIONS = [
  "Coopératif", "Draft de cartes", "Placement d'ouvriers", "Pose de tuiles", "Dés",
  "Gestion de ressources", "Deck-building", "Contrôle de zone", "Enchères", "Bluff",
  "Combat", "Set collection", "Programmation", "Déduction", "Narration", "Mémoire",
  "Stop ou encore", "Combos", "Négociation", "Stratégie", "Familial", "Ambiance",
  "Rôles cachés", "Enquête", "Jeu en équipe", "Placement", "Gestion", "Roll'n'write",
  "Flip'n'write", "Jeu de plis", "Jeu de défausse", "Jeu de cartes", "JCC (jeu de cartes à collectionner)",
  "Enfants",
  "JCE (jeu de cartes évolutif)", "Party game", "Escape game", "Legacy", "Gestion de main",
  "Majorité", "Course", "Exploration", "Construction de moteur", "Tuiles à connecter",
  "Paris", "Mise", "Asymétrique", "Temps réel", "Adresse / dextérité", "Quiz / culture",
].sort((a, b) => a.localeCompare(b, "fr"));

// Liste effective (mise a jour depuis la base au chargement) + alias -> nom
// pour convertir automatiquement les mecaniques lors des imports BGG.
let MECHANIC_SUGGESTIONS = DEFAULT_MECHANIC_SUGGESTIONS;
let MECH_DB_ALIASES = {};

/* ---------- Mecaniques particulieres (composeur de tablee) ---------- */
// Normalise une mecanique pour comparaison : minuscules, sans accents.
const normMech = (s) => (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
// Un jeu est « pour enfants » s'il porte la mecanique « Enfants ».
const isKidsGame = (g) => (g?.mechanics || []).some((m) => normMech(m).startsWith("enfant"));
// Jeux « one shot » : une fois joues, l'interet retombe (l'histoire est connue).
const ONE_SHOT_MECHANICS = ["Enquête", "Escape game", "Legacy"];
const ONE_SHOT_SET = new Set(ONE_SHOT_MECHANICS.map(normMech));
const isOneShotGame = (g) => (g?.mechanics || []).some((m) => ONE_SHOT_SET.has(normMech(m)));

/* ---------- Scores des parties ---------- */
// Sens du score d'un jeu : "high" = le plus grand l'emporte, "low" = le plus petit.
const scoreDirOf = (g) => (g?.scoreDirection === "low" ? "low" : "high");
const SCORE_DIR_LABEL = { high: "le plus grand score l'emporte", low: "le plus petit score l'emporte" };
// Moyenne arrondie au dixieme, formatee a la francaise.
const fmtPts = (n) => (Math.round(n * 10) / 10).toLocaleString("fr-FR");
// Classement des participants d'une partie selon le sens du score.
function rankParticipants(parts, dir) {
  return [...(parts || [])].sort((a, b) => {
    const sa = a.score, sb = b.score;
    if (sa == null && sb == null) return (a.name || "").localeCompare(b.name || "", "fr");
    if (sa == null) return 1;
    if (sb == null) return -1;
    return dir === "low" ? sa - sb : sb - sa;
  });
}

/* ---------- Comptes enfants ---------- */
// Age limite : le jour de ses 14 ans, la tetine disparait automatiquement.
const CHILD_AGE_LIMIT = 14;
// Age d'un membre si sa date de naissance COMPLETE est renseignee, sinon null.
function memberAge(u) {
  if (!u || !u.birthYear || !u.birthMonth || !u.birthDay) return null;
  const now = new Date();
  let age = now.getFullYear() - Number(u.birthYear);
  const m = now.getMonth() + 1, d = now.getDate();
  if (m < Number(u.birthMonth) || (m === Number(u.birthMonth) && d < Number(u.birthDay))) age -= 1;
  return age;
}
// Un compte est « enfant » si la case est cochee ET qu'il n'a pas encore 14 ans
// (si aucune date de naissance complete n'est connue, la case fait foi).
function isChildAccount(u) {
  if (!u || !u.isChild) return false;
  const age = memberAge(u);
  return age == null || age < CHILD_AGE_LIMIT;
}

/* =============================================================================
   STORAGE — Upload des images vers Supabase Storage
   Les images sont stockées dans le bucket public "aladj-images", organisées par
   dossier selon le type (games, extensions, upcoming, avatars, places).
   Les URLs publiques sont mises en cache par les navigateurs → bien plus efficient
   que stocker du base64 dans la base de données.
   ============================================================================= */

// Envoie une image vers Cloudflare R2 (via la fonction serverless /api/r2-upload)
// et renvoie l'URL publique R2. Les images sont servies par R2 (egress gratuit).
// - Si vide → "" (pas d'image)
// - Si déjà une URL R2 → renvoyée telle quelle (rien à faire)
// - Si base64 OU URL externe (BGG, ancien Supabase) → uploadée vers R2
// folder : "games" | "extensions" | "upcoming" | "avatars" | "places"
const R2_PUBLIC_PREFIX = "https://pub-a3613b9531e948d684f5307f0105183b.r2.dev";

// Lien d'achat affilié Ludum (partenariat ALADJ, code aff=146).
// Si une URL de fiche précise est fournie on l'utilise, sinon on génère une recherche par nom.
// Le code d'affiliation est ajouté avec "?" ou "&" selon que l'URL a déjà des paramètres.
const LUDUM_AFF = "146";
const LUDUM_SEARCH_BASE = "https://www.ludum.fr/recherche?controller=search&s=";
// Neutralise les URLs saisies par les membres : seuls http(s) sont autorisés
// (rejette javascript:, data:, etc.) ; ajoute https:// si le schéma manque.
function safeUrl(u) {
  const v = (u || "").trim();
  if (!v) return "";
  if (/^https?:\/\//i.test(v)) return v;
  if (/^[a-z][a-z0-9+.-]*:/i.test(v)) return ""; // autre schéma → refusé
  return "https://" + v;
}

function ludumLink(name, storedUrl) {
  const stored = safeUrl(storedUrl);
  const base = stored || (LUDUM_SEARCH_BASE + encodeURIComponent((name || "").trim()));
  return base + (base.includes("?") ? "&" : "?") + "aff=" + LUDUM_AFF;
}
async function uploadImageToStorage(image, folder = "games") {
  if (!image) return "";
  // Déjà sur notre R2 → rien à faire
  if (image.startsWith(R2_PUBLIC_PREFIX)) return image;

  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 20000); // 20 s (le serveur peut télécharger une URL externe)
    const res = await fetch("/api/r2-upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image, folder }),
      signal: ctrl.signal,
    });
    clearTimeout(timer);
    if (!res.ok) {
      console.error("Upload R2 échec :", res.status);
      return image; // repli : on garde la valeur d'origine
    }
    const data = await res.json();
    return data.url || image;
  } catch (e) {
    console.error("Upload R2 exception :", e);
    return image; // repli : on garde la valeur d'origine
  }
}

/* =============================================================================
   IMPORT BoardGameGeek
   -----------------------------------------------------------------------------
   Ces fonctions appellent une route serverless /api/bgg (incluse dans le projet)
   qui relaie les requêtes vers BoardGameGeek. Cela évite le blocage "CORS" du
   navigateur. La traduction passe par /api/translate.
   ============================================================================= */
// Récupère le XML de BGG. On passe par notre fonction serveur /api/bgg qui ajoute
// le jeton d'authentification BGG (obligatoire désormais). Proxies en ultime secours.
async function fetchBggXml(bggUrl) {
  const u = new URL(bggUrl);
  const route = u.pathname.includes("/search") ? "search" : "thing";
  const sp = u.searchParams;
  const params = new URLSearchParams();
  params.set("path", route);
  for (const [k, v] of sp.entries()) params.set(k, v);
  const own = `/api/bgg?${params.toString()}`;

  const isValid = (t) => t && t.includes("<") && (t.includes("<item") || t.includes("<items"));

  // 1) notre fonction serveur authentifiée (la voie principale)
  try {
    const res = await fetch(own);
    if (res.ok) { const t = await res.text(); if (isValid(t)) return t; }
  } catch (e) { /* secours */ }

  // 2) proxies CORS publics (secours si le serveur échoue)
  const proxies = [
    (x) => `https://api.allorigins.win/raw?url=${encodeURIComponent(x)}`,
    (x) => `https://api.codetabs.com/v1/proxy/?quest=${encodeURIComponent(x)}`,
  ];
  for (const make of proxies) {
    try {
      const res = await fetch(make(bggUrl));
      if (res.ok) { const t = await res.text(); if (isValid(t)) return t; }
    } catch (e) { /* proxy suivant */ }
  }
  throw new Error("BGG_UNAVAILABLE");
}

async function bggSearch(query) {
  const q = query.trim();
  const text = await fetchBggXml(`https://boardgamegeek.com/xmlapi2/search?type=boardgame&query=${encodeURIComponent(q)}`);
  const xml = new DOMParser().parseFromString(text, "text/xml");
  let items = Array.from(xml.querySelectorAll("item")).map((it) => ({
    id: it.getAttribute("id"),
    name: it.querySelector("name")?.getAttribute("value") || "Sans titre",
    year: it.querySelector("yearpublished")?.getAttribute("value") || "",
  }));
  // tri par pertinence : correspondance exacte, puis "commence par", puis "contient",
  // puis par ancienneté (les jeux plus anciens / de base sont souvent les plus pertinents)
  const norm = (s) => (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
  const nq = norm(q);
  const score = (it) => {
    const n = norm(it.name);
    if (n === nq) return 0;
    if (n.startsWith(nq)) return 1;
    if (n.includes(nq)) return 2;
    return 3;
  };
  items.sort((a, b) => {
    const sa = score(a), sb = score(b);
    if (sa !== sb) return sa - sb;
    // à pertinence égale, le plus ancien d'abord (souvent le jeu "de base")
    const ya = Number(a.year) || 9999, yb = Number(b.year) || 9999;
    return ya - yb;
  });
  return items.slice(0, 20);
}

async function bggDetails(id) {
  const text = await fetchBggXml(`https://boardgamegeek.com/xmlapi2/thing?id=${id}&stats=1`);
  const xml = new DOMParser().parseFromString(text, "text/xml");
  const it = xml.querySelector("item");
  if (!it) throw new Error("Jeu introuvable");
  const primaryName = Array.from(it.querySelectorAll("name")).find((n) => n.getAttribute("type") === "primary")?.getAttribute("value") || it.querySelector("name")?.getAttribute("value") || "";
  const year = it.querySelector("yearpublished")?.getAttribute("value") || "";
  const min = it.querySelector("minplayers")?.getAttribute("value") || "";
  const max = it.querySelector("maxplayers")?.getAttribute("value") || "";
  const time = it.querySelector("playingtime")?.getAttribute("value") || "";
  const img = it.querySelector("image")?.textContent || it.querySelector("thumbnail")?.textContent || "";
  let desc = it.querySelector("description")?.textContent || "";
  const ta = document.createElement("textarea"); ta.innerHTML = desc;
  desc = ta.value.replace(/&#10;/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  const mechanics = Array.from(it.querySelectorAll("link")).filter((l) => l.getAttribute("type") === "boardgamemechanic").map((l) => l.getAttribute("value")).slice(0, 6);
  return { name: primaryName, year: year ? Number(year) : "", min: min ? Number(min) : "", max: max ? Number(max) : "", time: time ? Number(time) : "", img, desc, mechanics };
}

const MECH_FR = {
  "Hand Management": "Gestion de main", "Set Collection": "Set collection", "Tile Placement": "Pose de tuiles",
  "Worker Placement": "Placement d'ouvriers", "Dice Rolling": "Lancer de dés", "Card Drafting": "Draft de cartes",
  "Deck, Bag, and Pool Building": "Deck-building", "Area Majority / Influence": "Contrôle de zone",
  "Cooperative Game": "Jeu coopératif", "Auction/Bidding": "Enchères", "Variable Player Powers": "Pouvoirs variables",
  "Route/Network Building": "Construction de réseau", "Modular Board": "Plateau modulaire", "Trading": "Commerce",
  "Push Your Luck": "Stop ou encore", "Pattern Building": "Construction de motifs", "Grid Movement": "Déplacement sur grille",
  "Simultaneous Action Selection": "Sélection d'action simultanée", "Betting and Bluffing": "Pari et bluff",
  "Action Points": "Points d'action", "Memory": "Mémoire", "Storytelling": "Narration", "Voting": "Vote",
};
const translateMechanics = (arr) => (arr || []).map((m) => MECH_FR[m] || MECH_DB_ALIASES[m] || MECH_DB_ALIASES[String(m || "").toLowerCase()] || m);

async function translateText(text) {
  if (!text) return "";
  try {
    // Timeout de 8 s : sur mobile, une connexion lente pouvait laisser le fetch
    // en attente très longtemps et bloquer l'affichage de l'aperçu du jeu.
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 8000);
    const res = await fetch(`/api/translate`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: text.slice(0, 1500) }),
      signal: ctrl.signal,
    });
    clearTimeout(timer);
    if (res.ok) { const data = await res.json(); if (data.translated) return data.translated; }
  } catch (e) { /* repli : texte original (timeout, hors-ligne, quota dépassé…) */ }
  return text;
}

/* =============================================================================
   CONTEXTE GLOBAL — connecté à Supabase
   ============================================================================= */
/* =============================================================================
   CONFIRMATION UNIVERSELLE — remplace window.confirm par un modal maison.
   Usage : const { askConfirm } = useApp();
           if (await askConfirm({ title, message, confirmLabel })) { ... }
   askConfirm accepte aussi une simple chaîne et retourne une promesse booléenne
   (true = confirmé). z-index 3000 : passe au-dessus des modales du site (2000).
   Les suppressions de notifications restent volontairement sans confirmation
   (action très fréquente et sans risque).
   ============================================================================= */
function ConfirmDialog({ state, onClose }) {
  useEffect(() => {
    if (!state) return;
    // Phase de capture + stopPropagation : Échap ferme la confirmation SANS
    // fermer la modale située en dessous (qui écoute aussi Échap sur window).
    const onKey = (ev) => { if (ev.key === "Escape") { ev.stopPropagation(); onClose(false); } };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [state, onClose]);
  useScrollLock(!!state);
  if (!state) return null;
  const { title = "Confirmer ?", message = "", confirmLabel = "Confirmer", cancelLabel = "Annuler", danger = true } = state;
  return (
    <div onMouseDown={(ev) => { if (ev.target === ev.currentTarget) onClose(false); }}
      style={{ position: "fixed", inset: 0, zIndex: 3000, background: "rgba(15,30,48,.55)", display: "grid", placeItems: "center", padding: 18 }}>
      <div style={{ background: C.paper, borderRadius: 20, border: "1px solid #ece2d0", boxShadow: "0 18px 50px rgba(15,30,48,.35)", padding: "22px 24px", width: "100%", maxWidth: 420 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 10 }}>
          <AlertTriangle size={20} color={danger ? C.red : C.amber} />
          <h3 style={{ fontFamily: "'Fredoka',sans-serif", fontSize: 17, margin: 0, color: C.navy }}>{title}</h3>
        </div>
        <p style={{ fontSize: 14, color: "#5e5346", lineHeight: 1.55, margin: "0 0 18px" }}>{message}</p>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", flexWrap: "wrap" }}>
          <Btn variant="soft" onClick={() => onClose(false)}>{cancelLabel}</Btn>
          <Btn variant={danger ? "red" : "teal"} onClick={() => onClose(true)}>{confirmLabel}</Btn>
        </div>
      </div>
    </div>
  );
}

const AppCtx = createContext(null);
const useApp = () => useContext(AppCtx);

// Petite couronne ambre signalant un membre décisionnaire (réutilisable dans les listes)
// Pastilles des couleurs de jeu préférées d'un membre (top 1/2/3), pour les soirées.
function ColorPrefs({ colors, size = 13 }) {
  const list = (colors || []).map(colorByKey).filter(Boolean).slice(0, 3);
  if (!list.length) return null;
  const label = list.map((c, i) => `${i + 1}. ${c.label}`).join("  ·  ");
  return (
    <span title={`Couleurs préférées — ${label}`} style={{ display: "inline-flex", alignItems: "center", gap: 2, marginLeft: 2 }}>
      {list.map((c, i) => (
        <span key={i} style={{ width: size, height: size, borderRadius: "50%", background: c.hex, border: "1.5px solid #fff", boxShadow: "0 0 0 1px rgba(0,0,0,.12)", marginLeft: i ? -4 : 0, zIndex: 3 - i }} />
      ))}
    </span>
  );
}

// Badges en vitrine d'un membre, en mini-médailles inline (trombinoscope, listes).
function FeaturedBadgesInline({ member, size = 16 }) {
  const { plays, events, games, upcoming, beltByGame } = useApp();
  const keys = (member?.featuredBadges || []).slice(0, 3);
  const badges = useMemo(() => {
    if (!keys.length) return [];
    return badgesFor(member.id, { plays, events, games, upcoming, beltByGame })
      .filter((b) => keys.includes(b.def.key) && b.tier > 0);
  }, [member, plays, events, games, upcoming, beltByGame]); // eslint-disable-line
  if (!badges.length) return null;
  return (
    <span style={{ display: "inline-flex", gap: 3, alignItems: "center" }}>
      {badges.map((b) => (
        <span key={b.def.key} title={`${b.def.label} — ${TIER_NAMES[b.tier - 1]} (${b.count} ${b.def.unit})`}
          style={{ width: size + 6, height: size + 6, borderRadius: "50%", display: "grid", placeItems: "center", background: `${TIER_COLORS[b.tier - 1]}22`, border: `1.5px solid ${TIER_COLORS[b.tier - 1]}`, fontSize: size * 0.62, lineHeight: 1 }}>
          {b.def.emoji}
        </span>
      ))}
    </span>
  );
}

// Rangée des badges obtenus d'un membre (fiche publique) : vitrine d'abord.
function MemberBadgesRow({ member, data }) {
  const badges = useMemo(() => {
    const all = badgesFor(member.id, data).filter((b) => b.tier > 0);
    const feat = member.featuredBadges || [];
    return all.sort((a, b) => (feat.includes(b.def.key) ? 1 : 0) - (feat.includes(a.def.key) ? 1 : 0) || b.tier - a.tier);
  }, [member, data]); // eslint-disable-line
  if (!badges.length) return null;
  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center", marginTop: 10 }}>
      <span style={{ fontSize: 12, color: "#9c8d79" }}>Badges :</span>
      {badges.map((b) => (
        <span key={b.def.key} title={`${b.def.label} — ${b.count} ${b.def.unit}`}
          style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px 3px 5px", borderRadius: 999, background: `${TIER_COLORS[b.tier - 1]}15`, border: `1.5px solid ${TIER_COLORS[b.tier - 1]}` }}>
          <span style={{ fontSize: 14 }}>{b.def.emoji}</span>
          <span style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 600, fontSize: 12, color: C.navy }}>{b.def.label}</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: TIER_COLORS[b.tier - 1] }}>{TIER_NAMES[b.tier - 1]}</span>
          {(member.featuredBadges || []).includes(b.def.key) && <span style={{ fontSize: 11 }}>⭐</span>}
        </span>
      ))}
    </div>
  );
}

// Tetine : marque visuelle des comptes enfants (pendant de la couronne des decisionnaires).
function PacifierIcon({ size = 13, color = C.purple }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ flexShrink: 0, display: "block" }}>
      <circle cx="12" cy="4.4" r="3.1" stroke={color} strokeWidth="2.2" />
      <ellipse cx="12" cy="12.3" rx="7.6" ry="4.4" fill={color} />
      <path d="M12 16.2c2.3 0 3.8 1.5 3.8 3.3S14.3 22.8 12 22.8 8.2 21.3 8.2 19.5 9.7 16.2 12 16.2Z" fill={color} />
    </svg>
  );
}

// Tetine affichee a cote du nom d'un membre enfant (listes, commentaires, soirees...)
function ChildPacifierFor({ id, size = 13 }) {
  const { childIds } = useApp();
  if (!id || !childIds || !childIds.has(id)) return null;
  return (
    <span title={`Compte enfant (moins de ${CHILD_AGE_LIMIT} ans)`} style={{ display: "inline-flex", flexShrink: 0 }}>
      <PacifierIcon size={size} />
    </span>
  );
}

// Choix du sens du score sur une fiche de jeu (creation / modification).
// C'est la meme information que celle utilisee par le chrono.
function ScoreDirectionField({ value, onChange }) {
  const opts = [
    { v: "high", t: "Le plus grand score l'emporte", ico: TrendingUp },
    { v: "low", t: "Le plus petit score l'emporte", ico: TrendingDown },
    { v: "", t: "Non applicable (coopératif...)", ico: EyeOffIcon },
  ];
  return (
    <Field label="Sens du score" hint="Sert au chrono : le vainqueur est déduit automatiquement des points saisis. Modifiable à tout moment, y compris depuis le chrono.">
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {opts.map((o) => {
          const on = (value || "") === o.v;
          const Ico = o.ico;
          return (
            <button key={o.v || "none"} type="button" onClick={() => onChange(o.v)} style={{
              display: "flex", alignItems: "center", gap: 7, padding: "8px 13px", borderRadius: 999, cursor: "pointer",
              fontFamily: "'Fredoka',sans-serif", fontWeight: 600, fontSize: 13,
              border: `2px solid ${on ? C.teal : "#e6dcc9"}`, background: on ? C.teal : "#fff", color: on ? "#fff" : "#8a7c6a",
            }}><Ico size={14} /> {o.t}</button>
          );
        })}
      </div>
    </Field>
  );
}

// Le pave de saisie du chrono, reutilise pour les parties saisies a la main.
// On intercepte Escape en phase de capture : sinon la touche fermerait aussi
// la fenetre d'enregistrement placee dessous.
function ScorePadOverlay({ name, initialScore, onClose, onApply }) {
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useScrollLock(true);   // le pave couvre l'ecran : la page derriere doit rester figee
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") { e.stopPropagation(); closeRef.current(); } };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, []);
  return <ScorePad name={name} initialScore={initialScore} onClose={onClose} onApply={onApply} />;
}

// Tableau des scores d'une partie : nom du joueur + points, classe selon
// le sens du score, trophee sur le ou les vainqueurs.
function PlayScoreBoard({ play, game, compact }) {
  const dir = scoreDirOf(game);
  const parts = (play?.participants || []).filter((pt) => pt.confirmed !== false);
  if (!parts.some((pt) => pt.score != null)) return null;
  const ranked = rankParticipants(parts, dir);
  return (
    <div style={{ background: "rgba(26,58,92,.035)", borderRadius: 12, padding: compact ? "8px 10px" : "10px 12px", marginTop: 8 }}>
      <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: .5, fontWeight: 700, color: "#9c8d79", marginBottom: 7 }}>
        Scores · {SCORE_DIR_LABEL[dir]}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr)", gap: 4 }}>
        {ranked.map((pt, i) => (
          <div key={(pt.userId || pt.guestName || "x") + i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13.5, minWidth: 0 }}>
            <span style={{ width: 17, textAlign: "right", color: "#b6a78f", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{pt.score == null ? "–" : i + 1}</span>
            <span style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 5, color: C.navy, fontWeight: pt.isWinner ? 700 : 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {pt.name}
              {pt.userId && <ChildPacifierFor id={pt.userId} size={11} />}
              {!pt.userId && <span style={{ fontSize: 11, color: "#b6a78f" }}>(invité)</span>}
            </span>
            {pt.isWinner && <Trophy size={13} color={C.amber} style={{ flexShrink: 0 }} />}
            <span style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 700, color: pt.isWinner ? C.amber : C.navy, fontSize: 13.5, flexShrink: 0 }}>
              {pt.score == null ? "—" : `${pt.score.toLocaleString("fr-FR")} pt${Math.abs(pt.score) > 1 ? "s" : ""}`}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function DeciderCrownFor({ id, size = 13 }) {
  const { deciderIds } = useApp();
  if (!id || !deciderIds || !deciderIds.has(id)) return null;
  return (
    <span title="Membre décisionnaire" style={{ display: "inline-flex", flexShrink: 0 }}>
      <Crown size={size} color={C.amber} />
    </span>
  );
}

// Récupère TOUTES les lignes d'une table en contournant la limite de 1000 lignes
// imposée par Supabase : on pagine par paquets de 1000. orderCols garantit un ordre
// stable entre les pages (on passe les colonnes de clé primaire). Renvoie { data }
// pour rester interchangeable avec une requête Supabase classique dans loadData.
async function fetchAllRows(table, columns, orderCols) {
  const size = 1000;
  let from = 0;
  const all = [];
  let err = null;
  for (let guard = 0; guard < 100; guard++) {
    let q = supabase.from(table).select(columns);
    (orderCols || []).forEach((c) => { q = q.order(c, { ascending: true }); });
    const { data, error } = await q.range(from, from + size - 1);
    if (error) { console.error("fetchAllRows", table, error.message); err = error; break; }
    if (!data || data.length === 0) break;
    all.push(...data);
    if (data.length < size) break;
    from += size;
  }
  return { data: all, error: err };
}

// transforme une ligne "games" + ses notes en objet utilisé par l'interface
function mapGame(row, ratingsByGame, nameById = {}, commentsByGame = {}, ownersByGame = {}, extsByGame = {}, roleById = {}, playCountByGame = {}, discoveriesByGame = {}) {
  const ratings = {};
  (ratingsByGame[row.id] || []).forEach((r) => { ratings[r.user_id] = Number(r.value); });

  // ownersByGame[row.id] est un tableau d'objets { owner_id, confirmed, declared_by }
  // (auparavant c'était de simples ID — on garde la compat en testant)
  const ownerRows = ownersByGame[row.id] || [];
  // game_owners fait desormais autorite, sans aucun repli : une fiche sans ligne
  // de possession est une FICHE DE REFERENCE (personne ne possede ce jeu).
  // L'ancien repli sur games.owner_id a ete supprime avec le lot E : il aurait
  // re-attribue au createur toute fiche dont le dernier proprietaire se retire,
  // rendant les fiches de reference impossibles. Les anciennes fiches ont ete
  // reprises une bonne fois pour toutes par migration_lot_E.sql.
  // Rappel : games.owner_id ne designe PAS un possesseur mais l'auteur de la fiche.
  const normalizedOwners = ownerRows;

  const ownerToInfo = (o) => ({
    id: o.owner_id,
    name: nameById[o.owner_id] || "Membre",
    role: roleById[o.owner_id] || "non",
    confirmed: o.confirmed !== false,
    declaredBy: o.declared_by || null,
    declaredByName: o.declared_by ? (nameById[o.declared_by] || "un membre") : null,
  });

  // Possesseurs confirmés (affichés normalement)
  const confirmedOwners = normalizedOwners
    .filter((o) => o.confirmed !== false)
    .map(ownerToInfo)
    .sort((a, b) => {
      if (a.role === "decideur" && b.role !== "decideur") return -1;
      if (b.role === "decideur" && a.role !== "decideur") return 1;
      return a.name.localeCompare(b.name, "fr");
    });

  // Possessions en attente (déclarées par un autre, le concerné n'a pas encore confirmé)
  const pendingOwners = normalizedOwners
    .filter((o) => o.confirmed === false)
    .map(ownerToInfo)
    .sort((a, b) => a.name.localeCompare(b.name, "fr"));

  // Pour la rétro-compatibilité, "owners" et "ownerIds" listent les confirmés.
  // Le code existant qui consulte g.owners / g.ownerIds continue de fonctionner.
  const owners = confirmedOwners;
  const ownerIds = confirmedOwners.map((o) => o.id);

  // Envies de découvrir : liste des user IDs qui veulent découvrir ce jeu
  const wantIds = discoveriesByGame[row.id] || [];

  return {
    id: row.id, name: row.name, year: row.year || "", min: row.min_players || "", max: row.max_players || "",
    time: row.play_time || "", mechanics: row.mechanics || [], desc: row.description || "", img: row.image_url || "", ludumUrl: row.ludum_url || "",
    source: row.source || "manuel", ownerId: row.owner_id, ownerName: nameById[row.owner_id] || "Membre",
    owners, ownerIds,
    confirmedOwners, pendingOwners,           // nouvelles structures
    // Fiche de reference : aucun membre ne possede (encore) ce jeu. Ce n'est pas
    // un champ stocke, juste l'absence de proprietaire confirme -- rien a
    // desynchroniser. La fiche reste consultable et permet d'enregistrer des
    // parties (Board Game Arena, convention, joueurs exterieurs...), mais elle
    // n'est pas comptee dans les jeux de l'association.
    unowned: confirmedOwners.length === 0,
    wantIds,                                  // envies de découvrir : liste d'IDs
    extensions: extsByGame[row.id] || [],
    newPrice: row.new_price != null ? Number(row.new_price) : null,
    shared: row.shared !== false,
    playCount: playCountByGame[row.id] || 0,
    comments: (commentsByGame[row.id] || []).map((c) => ({ id: c.id, authorId: c.author_id, authorName: nameById[c.author_id] || "Membre", content: c.content, createdAt: c.created_at, updatedAt: c.updated_at })),
    ratings, addedAt: row.created_at ? new Date(row.created_at).getTime() : 0,
    // "high" = le plus grand score l'emporte, "low" = le plus petit, null = non renseigne
    scoreDirection: row.score_direction || null,
  };
}
function mapEvent(row, playersByEvent, nameById = {}, guestsByEvent = {}, commentsByEvent = {}, eventGamesByEvent = {}, gamesIndexById = {}) {
  return {
    id: row.id, date: row.event_date, time: row.event_time, place: row.place, placeId: row.place_id || null, min: row.min_players, max: row.max_players,
    notes: row.notes || "", online: !!row.online, hostId: row.host_id, hostName: nameById[row.host_id] || "Membre",
    deadline: row.deadline || null, isPrivate: row.is_private === true,
    signupDeadline: row.signup_deadline || null,
    players: (playersByEvent[row.id] || []).map((p) => ({ id: p.user_id, name: nameById[p.user_id] || "Membre" })),
    // un membre invité (event_guests.member_id) qui s'est aussi inscrit comme participant
    // n'est ni affiché ni compté deux fois : on le retire de la liste des invités
    guests: (guestsByEvent[row.id] || [])
      .filter((g) => !(g.member_id && (playersByEvent[row.id] || []).some((p) => p.user_id === g.member_id)))
      .map((g) => ({ id: g.id, name: g.guest_name, memberId: g.member_id, addedBy: g.added_by })),
    comments: (commentsByEvent[row.id] || []).map((c) => ({ id: c.id, authorId: c.author_id, authorName: nameById[c.author_id] || "Membre", content: c.content, createdAt: c.created_at, updatedAt: c.updated_at })),
    playedGames: (eventGamesByEvent[row.id] || []).map((eg) => ({
      id: eg.id, gameId: eg.game_id, addedBy: eg.added_by, addedByName: nameById[eg.added_by] || "Membre", playCount: eg.play_count || 1,
      gameName: gamesIndexById[eg.game_id]?.name || "(jeu supprimé)",
      gameImg: gamesIndexById[eg.game_id]?.img || "",
      createdAt: eg.created_at,
    })),
    createdAt: row.created_at ? new Date(row.created_at).getTime() : 0,
  };
}

function AppProvider({ children }) {
  const [ready, setReady] = useState(false);
  const [authUser, setAuthUser] = useState(null);     // utilisateur Supabase Auth
  const [passwordRecovery, setPasswordRecovery] = useState(false); // lien "mot de passe oublie" suivi
  const [currentUser, setCurrentUser] = useState(null); // profil (avec name, role)
  const [bannedNotice, setBannedNotice] = useState(false); // affiché si un membre banni tente de se connecter
  const [memberEmails, setMemberEmails] = useState({}); // { userId: email } — chargé uniquement si admin
  const [users, setUsers] = useState([]);
  const [plays, setPlays] = useState([]);  // parties jouées (résultats)
  const [eventPlayDismissed, setEventPlayDismissed] = useState([]);  // suggestions de soirée refusées
  const [games, setGames] = useState([]);
  const [events, setEvents] = useState([]);
  const [places, setPlaces] = useState([]);
  const [loans, setLoans] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [myWeights, setMyWeights] = useState({}); // { gameId: weight_g } pour l'utilisateur connecté
  const [notifications, setNotifications] = useState([]); // notifications du membre connecté
  // Membre pour lequel les tables personnelles (notifications, suggestions
  // refusées) ont effectivement été chargées. Tant qu'il ne correspond pas au
  // membre connecté, les compteurs restent muets : mieux vaut pas de pastille
  // qu'une pastille fausse.
  const [personalDataFor, setPersonalDataFor] = useState(null);
  // Rejets de suggestions du membre : { gameId, reason, snoozeUntil, createdAt }.
  // On garde le motif et la date de retour éventuelle : le moteur s'en sert pour
  // affiner, et « Mon espace » pour proposer de réafficher.
  const [dismissedRecos, setDismissedRecos] = useState([]);
  const [household, setHousehold] = useState({ memberIds: [], invitesReceived: [], invitesSent: [] }); // regroupement familial (le mien)
  // Carnet d'invités du foyer : un simple raccourci de saisie pour les invités
  // récurrents (l'ami de Justine, le voisin de Léo). Aucune statistique ne leur
  // est rattachée — pour cela, mieux vaut devenir membre du site.
  const [householdGuests, setHouseholdGuests] = useState([]);
  const [householdByUser, setHouseholdByUser] = useState({}); // user_id -> ids des membres de son foyer
  const [fatalError, setFatalError] = useState(null);
  // Garde anti-chevauchement : si un rechargement est déjà en cours, on note qu'il
  // faudra en relancer un à la fin (au lieu de laisser deux chargements s'entremêler
  // et écraser des données plus fraîches par des plus anciennes).
  const loadingRef = useRef(false);
  const loadQueuedRef = useRef(false);

  // Ref vers l'id du membre connecté, lisible dans loadData sans le mettre en dépendance.
  const currentUserIdRef = useRef(null);
  // Le profil met un instant a arriver : on ne remet l'identifiant a null que
  // s'il n'y a plus personne d'authentifie, jamais pendant le chargement.
  useEffect(() => {
    if (currentUser?.id) currentUserIdRef.current = currentUser.id;
    else if (!authUser) currentUserIdRef.current = null;
  }, [currentUser, authUser]);

  // ⏱ Chronomètre de partie (multi-device) : état + détection d'un lien de jonction ?chrono=CODE
  const [chrono, setChrono] = useState(null); // null | { gameId } | { eventId } | { joinCode }
  const openChrono = useCallback((opts) => setChrono(opts), []);
  const closeChrono = useCallback(() => setChrono(null), []);
  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("chrono");
    if (code) setChrono({ joinCode: code });
  }, []);

  /* ---- Chargement des données partagées ---- */
  const loadData = useCallback(async () => {
    if (loadingRef.current) { loadQueuedRef.current = true; return; }
    loadingRef.current = true;
    try {
      // Historique préservé : on ne supprime plus automatiquement les moments anciens.
      // (Auparavant, les moments > 1 an étaient nettoyés ; ce n'est plus le cas pour
      // garder la mémoire des parties jouées dans le temps.)

      // On charge chaque table séparément, SANS jointure automatique (profiles(name)),
      // car cette jointure échoue si la clé étrangère n'est pas détectée par Supabase.
      // On reconstitue les noms côté application via une table de correspondance.
      const [{ data: profiles }, { data: gamesRows }, { data: ratings }, { data: eventsRows }, { data: eps }, { data: guests }, { data: comments }, { data: gameComments }, { data: placesRows }, { data: gameOwners }, { data: extsRows }, { data: extOwners }, { data: loansRows }, { data: weightsRows }, { data: eventGamesRows }, { data: upcRows }, { data: hypeRows }, { data: intentRows }, { data: upcCommentsRows }, { data: discRows }, { data: notifRows }, { data: dismissedRows }, { data: hhMembers }, { data: hhInvites }, { data: gamePlaysRows }, { data: gppRows }, { data: epdRows }, { data: mechRows }] = await Promise.all([
        supabase.from("profiles").select("id,name,role,is_admin,banned,share_library,avatar_url,city,bio,bgg_url,okkazeo_url,fav_mechanics,hated_mechanics,fav_colors,featured_badges,top_games,retro_emails,decideur_until,birth_day,birth_month,birth_year,is_child").order("name"),
        fetchAllRows("games", "id,name,year,min_players,max_players,play_time,mechanics,image_url,source,owner_id,new_price,shared,created_at,ludum_url,score_direction", ["id"]),
        fetchAllRows("ratings", "*", ["game_id", "user_id"]),
        supabase.from("events").select("*"),
        fetchAllRows("event_players", "*", ["event_id", "user_id"]),
        supabase.from("event_guests").select("*"),
        fetchAllRows("event_comments", "*", ["created_at", "id"]),
        fetchAllRows("game_comments", "*", ["created_at", "id"]),
        supabase.from("places").select("*").order("name"),
        fetchAllRows("game_owners", "*", ["game_id", "owner_id"]),
        fetchAllRows("extensions", "id,game_id,name,image_url,created_by", ["name", "id"]),
        fetchAllRows("extension_owners", "*", ["id"]),
        supabase.from("loans").select("*").order("started_at", { ascending: false }),
        fetchAllRows("game_weights", "*", ["game_id", "owner_id"]),
        fetchAllRows("event_games", "*", ["id"]),
        supabase.from("upcoming_games").select("id,name,year,min_players,max_players,play_time,mechanics,description,image_url,new_price,source,created_by,created_at,ludo_game_id,ludum_url,release_date,released,vo_released").order("name"),
        supabase.from("upcoming_hype").select("*"),
        supabase.from("upcoming_intent").select("*"),
        fetchAllRows("upcoming_comments", "*", ["created_at", "id"]),
        fetchAllRows("game_discoveries", "*", ["game_id", "user_id"]),
        currentUserIdRef.current ? supabase.from("notifications").select("*").eq("recipient_id", currentUserIdRef.current).order("created_at", { ascending: false }) : Promise.resolve({ data: [] }),
        currentUserIdRef.current ? supabase.from("reco_dismissed").select("game_id,reason,snooze_until,created_at").eq("user_id", currentUserIdRef.current) : Promise.resolve({ data: [] }),
        currentUserIdRef.current ? supabase.from("household_members").select("*") : Promise.resolve({ data: [] }),
        currentUserIdRef.current ? supabase.from("household_invites").select("*").eq("status", "pending") : Promise.resolve({ data: [] }),
        fetchAllRows("game_plays", "*", ["played_at", "id"]),
        fetchAllRows("game_play_participants", "*", ["id"]),
        currentUserIdRef.current ? fetchAllRows("event_play_dismissed", "*", ["id"]) : Promise.resolve({ data: [] }),
        supabase.from("mechanic_suggestions").select("name,aliases").order("name"),
      ]);

      // Liste des mecaniques geree par les admins. Si la table est vide ou
      // absente (script SQL pas encore execute), on garde la liste du code.
      if (mechRows && mechRows.length) {
        MECHANIC_SUGGESTIONS = mechRows.map((r) => r.name).sort((a, b) => a.localeCompare(b, "fr"));
        MECH_DB_ALIASES = {};
        mechRows.forEach((r) => (r.aliases || []).forEach((a) => {
          MECH_DB_ALIASES[a] = r.name;
          MECH_DB_ALIASES[String(a).toLowerCase()] = r.name;
        }));
      }

      // table de correspondance id -> nom
      const nameById = {};
      const roleById = {};
      (profiles || []).forEach((p) => { nameById[p.id] = p.name; roleById[p.id] = p.role; });

      // Parties jouées (résultats) : on rattache leurs participants
      const partsByPlay = {};
      (gppRows || []).forEach((pp) => { (partsByPlay[pp.play_id] ||= []).push(pp); });
      const playsList = (gamePlaysRows || []).map((gp) => ({
        id: gp.id, gameId: gp.game_id, playedAt: gp.played_at, occurrence: gp.occurrence || 1,
        sessionId: gp.session_id, eventId: gp.event_id, recordedBy: gp.recorded_by, durationSeconds: gp.duration_seconds || null,
        participants: (partsByPlay[gp.id] || []).map((pp) => ({
          userId: pp.user_id, guestName: pp.guest_name, isWinner: pp.is_winner, confirmed: pp.confirmed !== false,
          score: pp.score == null ? null : Number(pp.score),
          name: pp.user_id ? (nameById[pp.user_id] || "Membre") : (pp.guest_name || "Invité"),
        })),
      }));
      setPlays(playsList);
      setEventPlayDismissed(epdRows || []);
      // Ces données ne valent que pour l'identité connue au moment de la requête.
      setPersonalDataFor(currentUserIdRef.current || null);

      const ratingsByGame = {};
      (ratings || []).forEach((r) => { (ratingsByGame[r.game_id] ||= []).push(r); });
      const playersByEvent = {};
      (eps || []).forEach((p) => { (playersByEvent[p.event_id] ||= []).push(p); });
      const guestsByEvent = {};
      (guests || []).forEach((g) => { (guestsByEvent[g.event_id] ||= []).push(g); });
      // jeux joués : par moment ET compteur global par jeu
      const eventGamesByEvent = {};
      const playCountByGame = {};
      (eventGamesRows || []).forEach((eg) => {
        (eventGamesByEvent[eg.event_id] ||= []).push(eg);
        playCountByGame[eg.game_id] = (playCountByGame[eg.game_id] || 0) + (eg.play_count || 1);
      });
      const commentsByEvent = {};
      (comments || []).forEach((c) => { (commentsByEvent[c.event_id] ||= []).push(c); });
      const commentsByGame = {};
      (gameComments || []).forEach((c) => { (commentsByGame[c.game_id] ||= []).push(c); });
      // propriétaires multiples par jeu (table de liaison game_owners)
      // On stocke les lignes complètes pour récupérer confirmed et declared_by
      const ownersByGame = {};
      (gameOwners || []).forEach((o) => { (ownersByGame[o.game_id] ||= []).push(o); });
      // Envies de découvrir : qui veut découvrir quoi
      const discoveriesByGame = {};
      (discRows || []).forEach((d) => { (discoveriesByGame[d.game_id] ||= []).push(d.user_id); });
      // extensions par jeu, avec leurs propriétaires
      const extOwnersByExt = {};
      (extOwners || []).forEach((o) => { (extOwnersByExt[o.extension_id] ||= []).push({ id: o.owner_id, confirmed: o.confirmed !== false }); });
      const extsByGame = {};
      (extsRows || []).forEach((x) => {
        const list = extOwnersByExt[x.id] || [];
        const confirmed = list.filter((o) => o.confirmed);
        const pending = list.filter((o) => !o.confirmed);
        const cIds = confirmed.map((o) => o.id);
        (extsByGame[x.game_id] ||= []).push({
          id: x.id, name: x.name, img: x.image_url || "", createdBy: x.created_by,
          ownerIds: cIds, owners: cIds.map((id) => ({ id, name: nameById[id] || "Membre" })),
          pendingOwners: pending.map((o) => ({ id: o.id, name: nameById[o.id] || "Membre" })),
        });
      });

      setUsers((profiles || []).map((p) => ({ id: p.id, name: p.name, role: (p.decideur_until && new Date(p.decideur_until) > new Date()) ? "decideur" : "membre", decideurUntil: p.decideur_until || null, admin: p.is_admin, banned: p.banned === true, shareLibrary: p.share_library !== false, avatar: p.avatar_url || "", city: p.city || "", bio: p.bio || "", bggUrl: p.bgg_url || "", okkazeoUrl: p.okkazeo_url || "", favMechanics: p.fav_mechanics || [], hatedMechanics: p.hated_mechanics || [], favColors: p.fav_colors || [], featuredBadges: p.featured_badges || [], topGames: p.top_games || [], birthDay: p.birth_day || null, birthMonth: p.birth_month || null, birthYear: p.birth_year || null, isChild: p.is_child === true })));
      const mappedGames = (gamesRows || []).map((g) => mapGame(g, ratingsByGame, nameById, commentsByGame, ownersByGame, extsByGame, roleById, playCountByGame, discoveriesByGame));
      // index id->jeu pour résoudre les jeux joués dans mapEvent
      const gamesIndexById = {};
      mappedGames.forEach((g) => { gamesIndexById[g.id] = g; });
      setGames(mappedGames);
      setEvents((eventsRows || []).map((e) => mapEvent(e, playersByEvent, nameById, guestsByEvent, commentsByEvent, eventGamesByEvent, gamesIndexById)));
      setPlaces((placesRows || []).map((p) => ({ id: p.id, name: p.name, address: p.address || "", accessInfo: p.access_info || "", createdBy: p.created_by, createdByName: nameById[p.created_by] || "Membre" })));
      setLoans((loansRows || []).map((l) => ({
        id: l.id, gameId: l.game_id, lenderId: l.lender_id, borrowerId: l.borrower_id,
        lenderName: nameById[l.lender_id] || "Membre", borrowerName: nameById[l.borrower_id] || "Membre",
        gameName: (gamesRows || []).find((g) => g.id === l.game_id)?.name || "Jeu",
        weight: l.weight_g, startedAt: l.started_at, dueAt: l.due_at, returned: l.returned, returnedAt: l.returned_at,
      })));
      // poids privés de l'utilisateur connecté (RLS ne renvoie que les siens)
      const wmap = {};
      (weightsRows || []).forEach((w) => { wmap[w.game_id] = w.weight_g; });
      setMyWeights(wmap);

      // ---- Fiches "À venir" ----
      // Index des hypes / intentions / commentaires par fiche À venir
      const hypeByUpc = {};
      (hypeRows || []).forEach((h) => { (hypeByUpc[h.upcoming_id] ||= []).push(h); });
      const intentByUpc = {};
      (intentRows || []).forEach((i) => { (intentByUpc[i.upcoming_id] ||= []).push(i); });
      const upcCommentsByUpc = {};
      (upcCommentsRows || []).forEach((c) => { (upcCommentsByUpc[c.upcoming_id] ||= []).push(c); });
      // Pour le retrait auto : compter les vrais votes (ratings) par jeu de ludo
      const ratingsCountByGame = {};
      (ratings || []).forEach((r) => { ratingsCountByGame[r.game_id] = (ratingsCountByGame[r.game_id] || 0) + 1; });

      // Qui partage sa ludotheque ? Sert a n'annoncer que des jeux reellement
      // empruntables : un proprietaire qui garde sa ludotheque privee ne doit
      // pas apparaitre comme possesseur aux yeux des autres.
      const shareById = {};
      (profiles || []).forEach((p) => { shareById[p.id] = p.share_library !== false; });

      const allUpc = (upcRows || []).map((u) => {
        const hypes = {};
        (hypeByUpc[u.id] || []).forEach((h) => { hypes[h.user_id] = h.value; });
        const intents = {};
        (intentByUpc[u.id] || []).forEach((i) => { intents[i.user_id] = i.intent; });
        // résoudre la fiche ludo correspondante : via lien explicite OU via nom similaire
        let ludoGame = u.ludo_game_id ? (gamesRows || []).find((g) => g.id === u.ludo_game_id) : null;
        if (!ludoGame) {
          // recherche par similarité de nom (réutilise normGameName défini globalement)
          const nu = normGameName(u.name);
          ludoGame = (gamesRows || []).find((g) => normGameName(g.name) === nu);
        }
        const ludoVotes = ludoGame ? (ratingsCountByGame[ludoGame.id] || 0) : 0;
        // Qui possède déjà ce jeu ? On interroge la ludothèque plutôt qu'une
        // déclaration : seuls les propriétaires confirmés comptent, et on ignore
        // ceux qui ne partagent pas leur ludothèque.
        const ludoOwners = ludoGame
          ? (ownersByGame[ludoGame.id] || [])
              .filter((o) => o.confirmed !== false && shareById[o.owner_id] !== false)
              .map((o) => ({ id: o.owner_id, name: nameById[o.owner_id] || "Membre" }))
          : [];
        return {
          id: u.id, name: u.name, year: u.year || "", min: u.min_players || "", max: u.max_players || "",
          time: u.play_time || "", mechanics: u.mechanics || [], desc: u.description || "", img: u.image_url || "", ludumUrl: u.ludum_url || "",
          newPrice: u.new_price != null ? Number(u.new_price) : null,
          source: u.source || "manuel", createdBy: u.created_by, createdByName: nameById[u.created_by] || "Membre",
          releaseDate: u.release_date || null, released: u.released === true, voReleased: u.vo_released === true,
          ludoGameId: ludoGame ? ludoGame.id : null, ludoVotes, ludoOwners,
          hypes, intents,
          comments: (upcCommentsByUpc[u.id] || []).map((c) => ({ id: c.id, authorId: c.author_id, authorName: nameById[c.author_id] || "Membre", content: c.content, createdAt: c.created_at, updatedAt: c.updated_at })),
          addedAt: u.created_at ? new Date(u.created_at).getTime() : 0,
        };
      });
      // Règle de bascule : si la fiche ludo liée a ≥ 2 votes, on cache la fiche À venir.
      // On garde tout en base (la fiche reste consultable techniquement) mais on filtre l'affichage.
      setUpcoming(allUpc.filter((u) => u.ludoVotes < 2));

      // Notifications du membre connecté + jeux rejetés des suggestions
      setNotifications((notifRows || []).map((n) => ({
        id: n.id, recipientId: n.recipient_id, actorId: n.actor_id, type: n.type,
        message: n.message, linkKind: n.link_kind, linkId: n.link_id, read: n.read === true,
        createdAt: n.created_at,
      })));
      setDismissedRecos((dismissedRows || []).map((d) => ({
        gameId: d.game_id, reason: d.reason || null,
        snoozeUntil: d.snooze_until || null, createdAt: d.created_at || null,
      })));
      // Foyers (regroupement familial) : la composition de tous les foyers est
      // lisible ; on en tire mon foyer + une carte user -> membres de son foyer.
      {
        const myId = currentUserIdRef.current;
        const byHH = {};
        (hhMembers || []).forEach((m) => { (byHH[m.household_id] ||= []).push(m.user_id); });
        const map = {};
        Object.values(byHH).forEach((ids) => ids.forEach((id) => { map[id] = ids; }));
        setHouseholdByUser(map);
        const mine = (map[myId] || []);
        setHousehold({
          memberIds: mine.length ? mine : (hhMembers || []).filter((m) => m.user_id === myId).map((m) => m.user_id),
          invitesReceived: (hhInvites || []).filter((i) => i.invitee_id === myId),
          invitesSent: (hhInvites || []).filter((i) => i.inviter_id === myId),
        });
      }
    } catch (e) {
      console.error(e);
      setFatalError("Impossible de charger les données. Vérifiez la configuration Supabase.");
    } finally {
      loadingRef.current = false;
      if (loadQueuedRef.current) { loadQueuedRef.current = false; loadData(); }
    }
  }, []);

  /* ---- Rechargements ciblés (évitent de tout recharger pour les actions fréquentes) ---- */
  // Notes + envies de découvrir : ne recharge que ces deux tables et les fusionne
  // dans les jeux déjà en mémoire.
  const reloadGameSignals = useCallback(async () => {
    const [{ data: ratings }, { data: discs }] = await Promise.all([
      fetchAllRows("ratings", "*", ["game_id", "user_id"]),
      fetchAllRows("game_discoveries", "*", ["game_id", "user_id"]),
    ]);
    const rByGame = {};
    (ratings || []).forEach((r) => { (rByGame[r.game_id] ||= {})[r.user_id] = Number(r.value); });
    const dByGame = {};
    (discs || []).forEach((d) => { (dByGame[d.game_id] ||= []).push(d.user_id); });
    setGames((prev) => prev.map((g) => ({ ...g, ratings: rByGame[g.id] || {}, wantIds: dByGame[g.id] || [] })));
  }, []);

  // Parties jouées : ne recharge que les parties et leurs participants.
  const reloadPlays = useCallback(async () => {
    const [{ data: gamePlaysRows }, { data: gppRows }] = await Promise.all([
      fetchAllRows("game_plays", "*", ["played_at", "id"]),
      fetchAllRows("game_play_participants", "*", ["id"]),
    ]);
    const nameById = {};
    (users || []).forEach((u) => { nameById[u.id] = u.name; });
    const partsByPlay = {};
    (gppRows || []).forEach((pp) => { (partsByPlay[pp.play_id] ||= []).push(pp); });
    setPlays((gamePlaysRows || []).map((gp) => ({
      id: gp.id, gameId: gp.game_id, playedAt: gp.played_at, occurrence: gp.occurrence || 1,
      sessionId: gp.session_id, eventId: gp.event_id, recordedBy: gp.recorded_by, durationSeconds: gp.duration_seconds || null,
      participants: (partsByPlay[gp.id] || []).map((pp) => ({
        userId: pp.user_id, guestName: pp.guest_name, isWinner: pp.is_winner, confirmed: pp.confirmed !== false,
        score: pp.score == null ? null : Number(pp.score),
        name: pp.user_id ? (nameById[pp.user_id] || "Membre") : (pp.guest_name || "Invité"),
      })),
    })));
  }, [users]);

  /* ---- Session + écoute des changements d'auth ---- */
  useEffect(() => {
    if (!isConfigured) { setFatalError("config"); setReady(true); return; }
    let sub;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setAuthUser(session?.user || null);
      // On renseigne l'identifiant tout de suite, sans attendre que le profil
      // soit charge : loadData s'en sert pour decider s'il interroge les tables
      // personnelles. Sans cela, le tout premier chargement les ignore et les
      // pastilles s'affichent un instant avec de fausses valeurs.
      // (Un invite anonyme n'a pas de profil : on ne retient pas son identifiant.)
      const uid = session?.user && !session.user.is_anonymous ? session.user.id : null;
      currentUserIdRef.current = uid;
      await loadData();
      setReady(true);
      sub = supabase.auth.onAuthStateChange((_e, sess) => { setAuthUser(sess?.user || null); if (_e === 'PASSWORD_RECOVERY') setPasswordRecovery(true); });
    })();
    return () => sub?.data?.subscription?.unsubscribe();
  }, [loadData]);

  /* ---- Charger le profil du membre connecté ---- */
  const loadCurrentUser = useCallback(async () => {
    if (!authUser) { setCurrentUser(null); return; }
    // Invité anonyme (rejoint une partie via le chronomètre, sans compte) :
    // pas de profil, pas de membre dans la liste. On évite ainsi de créer de faux décisionnaires.
    if (authUser.is_anonymous) { setCurrentUser(null); return; }
    let { data } = await supabase.from("profiles").select("*").eq("id", authUser.id).single();
    // Première connexion via Google : pas encore de profil → on en crée un.
    if (!data) {
      const meta = authUser.user_metadata || {};
      const name = meta.full_name || meta.name || (authUser.email ? authUser.email.split("@")[0] : "Membre");
      const { data: created } = await supabase.from("profiles").insert({
        id: authUser.id, name, role: "membre", is_admin: false,
      }).select().single();
      data = created;
    }
    // Membre banni : on bloque l'accès et on le déconnecte immédiatement.
    if (data && data.banned) {
      setBannedNotice(true);
      await supabase.auth.signOut();
      setCurrentUser(null);
      return;
    }
    if (data) setCurrentUser({ id: data.id, name: data.name, role: (data.decideur_until && new Date(data.decideur_until) > new Date()) ? "decideur" : "membre", decideurUntil: data.decideur_until || null, admin: data.is_admin, banned: data.banned === true, shareLibrary: data.share_library !== false, avatar: data.avatar_url || "", city: data.city || "", bio: data.bio || "", bggUrl: data.bgg_url || "", okkazeoUrl: data.okkazeo_url || "", favMechanics: data.fav_mechanics || [], hatedMechanics: data.hated_mechanics || [], favColors: data.fav_colors || [], featuredBadges: data.featured_badges || [], topGames: data.top_games || [], retroEmails: data.retro_emails !== false, birthDay: data.birth_day || null, birthMonth: data.birth_month || null, birthYear: data.birth_year || null, isChild: data.is_child === true, momentsSeenAt: data.moments_seen_at || null });
  }, [authUser]);
  useEffect(() => { loadCurrentUser(); }, [loadCurrentUser]);

  // Quand l'identité du membre connecté change (connexion / déconnexion), on recharge
  // les données afin de récupérer SES notifications et SES rejets de suggestions
  // (qui dépendent de currentUserIdRef, non disponible au tout premier chargement).
  useEffect(() => {
    if (currentUser?.id) loadData();
  }, [currentUser?.id, loadData]);

  /* ---- Charger les e-mails des membres (réservé aux admins) ---- */
  // On appelle la fonction get_member_emails() (security definer) : elle ne renvoie
  // des données que si l'appelant est admin (garde-fou interne côté base).
  useEffect(() => {
    let cancelled = false;
    if (currentUser && currentUser.admin) {
      supabase.rpc("get_member_emails")
        .then(({ data, error }) => {
          if (cancelled || error || !data) return;
          const map = {};
          data.forEach((r) => { map[r.id] = r.email; });
          setMemberEmails(map);
        });
    } else {
      setMemberEmails({});
    }
    return () => { cancelled = true; };
  }, [currentUser]);

  /* ---- Abonnement temps réel : recharge quand la base change ---- */
  useEffect(() => {
    if (!isConfigured) return;
    const channel = supabase.channel("aladj-changes")
      .on("postgres_changes", { event: "*", schema: "public" }, (payload) => {
        if (payload.table && payload.table.startsWith("play_")) return; // géré par le chrono
        loadData();
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [loadData]);

  /* ---- Auth ---- */
  const register = useCallback(async ({ name, email, pwd, role }) => {
    const { data, error } = await supabase.auth.signUp({
      email, password: pwd, options: { data: { name: name.trim(), role: "membre" } },
    });
    if (error) return { error: error.message.includes("already") ? "Un compte existe déjà avec cet e-mail." : error.message };
    // si confirmation e-mail désactivée, on est connecté direct
    await loadData();
    return { user: { name: name.trim() }, needsConfirm: !data.session };
  }, [loadData]);

  const login = useCallback(async ({ email, pwd }) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: pwd });
    if (error) return { error: "E-mail ou mot de passe incorrect." };
    const { data: prof } = await supabase.from("profiles").select("name").eq("id", data.user.id).single();
    return { user: { name: prof?.name || "Membre" } };
  }, []);

  // Connexion via Google (OAuth). Redirige vers Google puis revient sur le site.
  const loginWithGoogle = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    if (error) return { error: error.message };
    return {}; // la redirection prend le relais
  }, []);

  // Envoi d'un lien de reinitialisation du mot de passe.
  const resetPassword = useCallback(async (email) => {
    if (!email || !email.trim()) return { error: "Indiquez votre adresse e-mail." };
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: window.location.origin });
    if (error) return { error: error.message };
    return {};
  }, []);

  // Definition d'un nouveau mot de passe (apres avoir suivi le lien recu par e-mail).
  const updatePassword = useCallback(async (newPwd) => {
    if (!newPwd || newPwd.length < 6) return { error: "Le mot de passe doit faire au moins 6 caracteres." };
    const { error } = await supabase.auth.updateUser({ password: newPwd });
    if (error) return { error: error.message };
    return {};
  }, []);

  const logout = useCallback(async () => { await supabase.auth.signOut(); setCurrentUser(null); }, []);

  /* ---- Modération admin : bannir / débannir un membre ---- */
  // Bannissement logique : le membre ne pourra plus se connecter, mais ses jeux
  // et ses notes restent en base (pas de dégât sur la ludothèque commune).
  const banUser = useCallback(async (userId) => {
    if (!currentUser?.admin) return { error: "Réservé aux administrateurs." };
    if (userId === currentUser.id) return { error: "Vous ne pouvez pas vous bannir vous-même." };
    const { error } = await supabase.from("profiles").update({ banned: true }).eq("id", userId);
    if (error) return { error: error.message };
    await loadData();
    return {};
  }, [currentUser, loadData]);

  const unbanUser = useCallback(async (userId) => {
    if (!currentUser?.admin) return { error: "Réservé aux administrateurs." };
    const { error } = await supabase.from("profiles").update({ banned: false }).eq("id", userId);
    if (error) return { error: error.message };
    await loadData();
    return {};
  }, [currentUser, loadData]);

  // Suppression définitive d'un membre (faux invités, comptes à retirer).
  const deleteUser = useCallback(async (userId) => {
    if (!currentUser?.admin) return { error: "Réservé aux administrateurs." };
    if (userId === currentUser.id) return { error: "Vous ne pouvez pas vous supprimer vous-même." };
    const { error } = await supabase.rpc("delete_member", { p_user_id: userId });
    if (error) return { error: error.message };
    await loadData();
    return {};
  }, [currentUser, loadData]);

  // Changer le statut décisionnaire d'un membre (admin uniquement).
  // Admin : accorder des jours de statut décisionnaire (s'ajoutent au restant).
  const adminAddMembershipDays = useCallback(async (userId, days) => {
    if (!currentUser?.admin) return { error: "Réservé aux administrateurs." };
    const { error } = await supabase.rpc("admin_add_membership_days", { p_user_id: userId, p_days: days });
    if (error) return { error: error.message };
    await loadData();
    return {};
  }, [currentUser, loadData]);

  // Admin : retirer immédiatement le statut décisionnaire.
  const adminRevokeMembership = useCallback(async (userId) => {
    if (!currentUser?.admin) return { error: "Réservé aux administrateurs." };
    const { error } = await supabase.rpc("admin_revoke_membership", { p_user_id: userId });
    if (error) return { error: error.message };
    await loadData();
    return {};
  }, [currentUser, loadData]);

  /* ---- Jeux ---- */
  const addGame = useCallback(async (d) => {
    if (!currentUser) return { error: "Connectez-vous." };
    // d.forUserIds : autres membres pour lesquels on déclare la possession (en attente de confirmation)
    // d.selfOwns   : si true (défaut), j'inscris aussi MA possession (confirmée)
    const selfOwns = d.selfOwns !== false;
    const forUserIds = (d.forUserIds || []).filter((id) => id && id !== currentUser.id);

    // owner_id sur la table games = TOUJOURS moi (le créateur de la fiche).
    // C'est nécessaire pour respecter la RLS d'insert (auth.uid() = owner_id).
    // La VRAIE possession est gérée par la table de liaison game_owners (avec confirmed/declared_by).
    // Si je ne possède pas le jeu, j'en suis quand même le « créateur de fiche » côté metadata.
    // Si l'image est en base64, on l'envoie d'abord vers Supabase Storage et on ne garde que l'URL.
    const imgUrl = await uploadImageToStorage(d.img || "", "games");
    const { data, error } = await supabase.from("games").insert({
      name: d.name.trim(), year: d.year || null, min_players: d.min || null, max_players: d.max || null,
      play_time: d.time || null, mechanics: d.mechanics || [], description: d.desc || "", image_url: imgUrl,
      new_price: d.newPrice != null && d.newPrice !== "" ? Number(d.newPrice) : null,
      source: d.source || "manuel", owner_id: currentUser.id,
      ludum_url: d.ludumUrl ? d.ludumUrl.trim() : "",
      score_direction: d.scoreDirection || null,
    }).select().single();
    if (error) return { error: error.message };

    // Inscriptions dans la table de liaison
    const rows = [];
    if (selfOwns) {
      // Moi : possession confirmée d'office
      rows.push({ game_id: data.id, owner_id: currentUser.id, confirmed: true, declared_by: currentUser.id });
    }
    forUserIds.forEach((uid) => {
      // Autres membres : possession en attente de leur confirmation
      rows.push({ game_id: data.id, owner_id: uid, confirmed: false, declared_by: currentUser.id });
    });
    if (rows.length > 0) {
      const { error: ownersErr } = await supabase.from("game_owners").insert(rows);
      if (ownersErr) {
        // On nettoie le jeu créé si l'inscription de possession échoue, sinon on aurait une fiche orpheline.
        await supabase.from("games").delete().eq("id", data.id);
        return { error: ownersErr.message };
      }
    }

    await loadData();
    return { game: data };
  }, [currentUser, loadData]);

  // Se rattacher à un jeu existant ("je l'ai aussi") — sans recréer de fiche
  const addOwner = useCallback(async (gameId) => {
    if (!currentUser) return { error: "Connectez-vous." };
    // Je m'ajoute moi-même : possession confirmée d'office
    const { error } = await supabase.from("game_owners").insert({
      game_id: gameId, owner_id: currentUser.id, confirmed: true, declared_by: currentUser.id,
    });
    if (error && !/duplicate|unique/i.test(error.message)) return { error: error.message };
    await loadData();
    return {};
  }, [currentUser, loadData]);

  // Déclarer qu'un ou plusieurs AUTRES membres possèdent aussi ce jeu (en attente de leur confirmation).
  const declareOwners = useCallback(async (gameId, userIds) => {
    if (!currentUser) return { error: "Connectez-vous." };
    const ids = (userIds || []).filter((id) => id && id !== currentUser.id);
    if (ids.length === 0) return { error: "Sélectionnez au moins un membre." };
    const rows = ids.map((uid) => ({ game_id: gameId, owner_id: uid, confirmed: false, declared_by: currentUser.id }));
    const { error } = await supabase.from("game_owners").insert(rows);
    if (error && !/duplicate|unique/i.test(error.message)) return { error: error.message };
    await loadData();
    return {};
  }, [currentUser, loadData]);

  // Se retirer d'un jeu ("je ne l'ai plus").
  // S'il ne reste plus aucun propriétaire, la fiche n'est PLUS supprimée : elle
  // devient une « fiche de référence » (grisée). Notes, avis, commentaires et
  // historique de parties sont conservés, et le jeu reste disponible pour
  // enregistrer des parties. Si quelqu'un le rachète un jour, un simple
  // « Je l'ai ! » lui redonne son statut normal.
  const removeOwner = useCallback(async (gameId) => {
    if (!currentUser) return;
    await supabase.from("game_owners").delete().eq("game_id", gameId).eq("owner_id", currentUser.id);
    // reste-t-il des propriétaires ?
    const { data: remaining } = await supabase.from("game_owners").select("owner_id").eq("game_id", gameId);
    if (remaining && remaining.length > 0) {
      // si le créateur initial (owner_id) vient de se retirer, on réaffecte owner_id
      // à un propriétaire restant pour garder la fiche cohérente
      const game = games.find((g) => g.id === gameId);
      if (game && game.ownerId === currentUser.id) {
        await supabase.from("games").update({ owner_id: remaining[0].owner_id }).eq("id", gameId);
      }
    }
    await loadData();
  }, [currentUser, loadData, games]);

  // ---- Possessions par procuration ----
  // Confirmer une possession en attente : "oui, je possède bien ce jeu"
  const confirmOwnership = useCallback(async (gameId) => {
    if (!currentUser) return;
    await supabase.from("game_owners").update({ confirmed: true })
      .eq("game_id", gameId).eq("owner_id", currentUser.id);
    await loadData();
  }, [currentUser, loadData]);

  // Refuser une possession en attente : on retire la ligne. Si la fiche devient
  // orpheline, elle est conservée en « fiche de référence » (voir removeOwner).
  const declineOwnership = useCallback(async (gameId) => {
    if (!currentUser) return;
    await supabase.from("game_owners").delete().eq("game_id", gameId).eq("owner_id", currentUser.id);
    const { data: remaining } = await supabase.from("game_owners").select("owner_id").eq("game_id", gameId);
    if (remaining && remaining.length > 0) {
      const game = games.find((g) => g.id === gameId);
      if (game && game.ownerId === currentUser.id) {
        await supabase.from("games").update({ owner_id: remaining[0].owner_id }).eq("id", gameId);
      }
    }
    await loadData();
  }, [currentUser, loadData, games]);

  // ---- Envies de découvrir ----
  // Bascule l'envie de découvrir un jeu (toggle). Si déjà présent → retire, sinon → ajoute.
  const toggleDiscover = useCallback(async (gameId) => {
    if (!currentUser) return;
    const g = games.find((x) => x.id === gameId);
    const already = g && (g.wantIds || []).includes(currentUser.id);
    if (already) {
      await supabase.from("game_discoveries").delete()
        .eq("game_id", gameId).eq("user_id", currentUser.id);
    } else {
      await supabase.from("game_discoveries").insert({ game_id: gameId, user_id: currentUser.id });
      // Notifier les propriétaires du jeu qu'un membre souhaite le découvrir (sauf moi).
      if (g) {
        // Fiche de référence : aucun propriétaire, donc personne à prévenir.
        const recipients = [...new Set(g.ownerIds || [])]
          .filter((id) => id && id !== currentUser.id);
        if (recipients.length > 0) {
          await supabase.from("notifications").insert(recipients.map((rid) => ({
            recipient_id: rid, actor_id: currentUser.id, type: "discovery",
            message: `${currentUser.name} aimerait découvrir votre jeu « ${g.name} »`,
            link_kind: "game", link_id: gameId,
          })));
        }
      }
    }
    await reloadGameSignals();
  }, [currentUser, games, reloadGameSignals]);

  // ---- Extensions ----
  // Ajouter une extension à un jeu (le créateur en devient premier propriétaire)
  const addExtension = useCallback(async (gameId, data) => {
    if (!currentUser) return { error: "Connectez-vous." };
    const imgUrl = await uploadImageToStorage(data.img || "", "extensions");
    const { data: row, error } = await supabase.from("extensions").insert({
      game_id: gameId, name: data.name.trim(), image_url: imgUrl, created_by: currentUser.id,
    }).select().single();
    if (error) return { error: error.message };
    await supabase.from("extension_owners").insert({ extension_id: row.id, owner_id: currentUser.id, confirmed: true, declared_by: currentUser.id });
    await loadData();
    return {};
  }, [currentUser, loadData]);

  // Se rattacher à une extension existante ("je l'ai aussi")
  const addExtensionOwner = useCallback(async (extId) => {
    if (!currentUser) return { error: "Connectez-vous." };
    const { error } = await supabase.from("extension_owners").insert({ extension_id: extId, owner_id: currentUser.id, confirmed: true, declared_by: currentUser.id });
    if (error && !/duplicate|unique/i.test(error.message)) return { error: error.message };
    await loadData();
    return {};
  }, [currentUser, loadData]);

  // Déclarer qu'un ou plusieurs AUTRES membres possèdent aussi cette extension
  // (en attente de leur confirmation depuis Ma ludothèque).
  const declareExtensionOwners = useCallback(async (extId, userIds) => {
    if (!currentUser) return { error: "Connectez-vous." };
    const ids = (userIds || []).filter((id) => id && id !== currentUser.id);
    if (ids.length === 0) return { error: "Sélectionnez au moins un membre." };
    const { error } = await supabase.rpc("declare_extension_owners", { p_ext_id: extId, p_user_ids: ids });
    if (error) return { error: error.message };
    await loadData();
    return {};
  }, [currentUser, loadData]);

  // Confirmer une possession d'extension déclarée par un autre membre.
  const confirmExtensionOwnership = useCallback(async (extId) => {
    if (!currentUser) return;
    const { error } = await supabase.rpc("confirm_extension_ownership", { p_ext_id: extId });
    if (error) { console.error("confirm_extension_ownership:", error.message); return { error: error.message }; }
    await loadData();
    return {};
  }, [currentUser, loadData]);

  // Se retirer d'une extension. Si plus aucun propriétaire, l'extension est supprimée.
  const removeExtensionOwner = useCallback(async (extId) => {
    if (!currentUser) return;
    await supabase.from("extension_owners").delete().eq("extension_id", extId).eq("owner_id", currentUser.id);
    const { data: remaining } = await supabase.from("extension_owners").select("id").eq("extension_id", extId);
    if (!remaining || remaining.length === 0) {
      await supabase.from("extensions").delete().eq("id", extId);
    }
    await loadData();
  }, [currentUser, loadData]);

  const updateGame = useCallback(async (id, patch) => {
    const imgUrl = await uploadImageToStorage(patch.img || "", "games");
    const fields = {
      name: patch.name, year: patch.year || null, min_players: patch.min || null, max_players: patch.max || null,
      play_time: patch.time || null, mechanics: patch.mechanics || [], description: patch.desc || "", image_url: imgUrl,
    };
    if (patch.newPrice !== undefined) fields.new_price = patch.newPrice === "" || patch.newPrice == null ? null : Number(patch.newPrice);
    if (patch.ludumUrl !== undefined) fields.ludum_url = patch.ludumUrl ? patch.ludumUrl.trim() : "";
    if (patch.scoreDirection !== undefined) fields.score_direction = patch.scoreDirection || null;
    await supabase.from("games").update(fields).eq("id", id);
    await loadData();
  }, [loadData]);

  // Enregistrer / mettre à jour MON poids pour un jeu (privé, par membre)
  const setGameWeight = useCallback(async (gameId, weightG) => {
    if (!currentUser) return { error: "Connectez-vous." };
    const w = weightG === "" || weightG == null ? null : Number(weightG);
    if (w == null) {
      await supabase.from("game_weights").delete().eq("game_id", gameId).eq("owner_id", currentUser.id);
    } else {
      await supabase.from("game_weights").upsert({ game_id: gameId, owner_id: currentUser.id, weight_g: w, updated_at: new Date().toISOString() }, { onConflict: "game_id,owner_id" });
    }
    await loadData();
    return {};
  }, [currentUser, loadData]);

  // Créer une location (le prêteur = utilisateur connecté). Durée fixe : 2 semaines.
  const createLoan = useCallback(async (gameId, borrowerId, weightG) => {
    if (!currentUser) return { error: "Connectez-vous." };
    if (!borrowerId) return { error: "Choisissez l'emprunteur." };
    const due = new Date(); due.setDate(due.getDate() + 14); // +2 semaines
    const { error } = await supabase.from("loans").insert({
      game_id: gameId, lender_id: currentUser.id, borrower_id: borrowerId,
      weight_g: weightG === "" || weightG == null ? null : Number(weightG),
      due_at: due.toISOString(), returned: false,
    });
    if (error) return { error: error.message };
    await loadData();
    return {};
  }, [currentUser, loadData]);

  // Clore une location : seul le prêteur le peut (le jeu a été rendu)
  const closeLoan = useCallback(async (loanId) => {
    if (!currentUser) return;
    await supabase.from("loans").update({ returned: true, returned_at: new Date().toISOString() }).eq("id", loanId).eq("lender_id", currentUser.id);
    await loadData();
  }, [currentUser, loadData]);

  const removeGame = useCallback(async (id) => { await supabase.from("games").delete().eq("id", id); await loadData(); }, [loadData]);

  // Partage : (dé)partager un jeu précis dans la ludothèque commune
  const toggleGameShared = useCallback(async (id, shared) => {
    await supabase.from("games").update({ shared }).eq("id", id);
    await loadData();
  }, [loadData]);

  // Partage : réglage global du membre (partager toute sa ludothèque ou non)
  const setShareLibrary = useCallback(async (value) => {
    if (!currentUser) return;
    await supabase.from("profiles").update({ share_library: value }).eq("id", currentUser.id);
    setCurrentUser((u) => u ? { ...u, shareLibrary: value } : u);
    await loadData();
  }, [currentUser, loadData]);

  // Recevoir (ou non) sa rétrospective mensuelle/annuelle par e-mail.
  const setRetroEmails = useCallback(async (value) => {
    if (!currentUser) return;
    await supabase.from("profiles").update({ retro_emails: value }).eq("id", currentUser.id);
    setCurrentUser((u) => u ? { ...u, retroEmails: value } : u);
  }, [currentUser]);

  // Mise à jour du profil du membre connecté
  // targetId : identifiant du membre a modifier. Absent = mon propre profil.
  // Modifier le profil d'un autre membre est reserve aux administrateurs
  // (la policy RLS "profiles_update" autorise deja auth.uid() = id OR is_admin()).
  const updateProfile = useCallback(async (patch, targetId) => {
    if (!currentUser) return { error: "Connectez-vous." };
    const id = targetId || currentUser.id;
    const isSelf = id === currentUser.id;
    if (!isSelf && currentUser.admin !== true) {
      return { error: "Seuls les administrateurs peuvent modifier le profil d'un autre membre." };
    }
    const fields = {};
    if (patch.name !== undefined) fields.name = patch.name.trim();
    if (patch.avatar !== undefined) fields.avatar_url = await uploadImageToStorage(patch.avatar, "avatars");
    if (patch.city !== undefined) fields.city = patch.city.trim();
    if (patch.bio !== undefined) fields.bio = patch.bio.slice(0, 500);
    if (patch.bggUrl !== undefined) fields.bgg_url = patch.bggUrl.trim();
    if (patch.okkazeoUrl !== undefined) fields.okkazeo_url = patch.okkazeoUrl.trim();
    if (patch.favMechanics !== undefined) fields.fav_mechanics = (patch.favMechanics || []).slice(0, 6);
    if (patch.hatedMechanics !== undefined) fields.hated_mechanics = patch.hatedMechanics || []; // pas de limite

    if (patch.favColors !== undefined) fields.fav_colors = (patch.favColors || []).slice(0, 3);
    if (patch.featuredBadges !== undefined) fields.featured_badges = (patch.featuredBadges || []).slice(0, 3);
    if (patch.topGames !== undefined) fields.top_games = (patch.topGames || []).slice(0, 10);
    if (patch.birthDay !== undefined) fields.birth_day = patch.birthDay ? Number(patch.birthDay) : null;
    if (patch.birthMonth !== undefined) fields.birth_month = patch.birthMonth ? Number(patch.birthMonth) : null;
    if (patch.birthYear !== undefined) fields.birth_year = patch.birthYear ? Number(patch.birthYear) : null;
    if (patch.isChild !== undefined) fields.is_child = !!patch.isChild;
    const { data, error } = await supabase.from("profiles").update(fields).eq("id", id).select("id");
    if (error) return { error: error.message };
    // Un update bloqué par la RLS ne renvoie pas d'erreur mais ne touche aucune
    // ligne : on le détecte ici plutôt que de laisser croire à une réussite.
    if (!data || data.length === 0) return { error: "Modification impossible : droits insuffisants côté base de données." };
    // Pour le state local, on garde le base64 si patch.avatar était en base64 (affichage immédiat avant rechargement)
    // mais en DB c'est désormais l'URL Storage
    if (isSelf) setCurrentUser((u) => u ? { ...u, ...patch, avatar: fields.avatar_url !== undefined ? fields.avatar_url : u.avatar, bio: patch.bio !== undefined ? patch.bio.slice(0, 500) : u.bio } : u);
    await loadData();
    return {};
  }, [currentUser, loadData]);

  const rateGame = useCallback(async (id, value) => {
    if (!currentUser) return;
    const existing = games.find((g) => g.id === id)?.ratings?.[currentUser.id];
    if (existing === value) {
      await supabase.from("ratings").delete().eq("game_id", id).eq("user_id", currentUser.id);
    } else {
      await supabase.from("ratings").upsert({ game_id: id, user_id: currentUser.id, value });
      // Si je note un jeu, mon envie de le découvrir n'a plus lieu d'être : je le retire automatiquement.
      // (sans gravité si je ne l'avais pas marqué : la requête supprime simplement zéro ligne.)
      await supabase.from("game_discoveries").delete().eq("game_id", id).eq("user_id", currentUser.id);
    }
    await reloadGameSignals();
  }, [currentUser, games, reloadGameSignals]);

  // Effacer explicitement sa note pour un jeu
  const clearRating = useCallback(async (id) => {
    if (!currentUser) return;
    await supabase.from("ratings").delete().eq("game_id", id).eq("user_id", currentUser.id);
    await loadData();
  }, [currentUser, loadData]);

  /* ---- Soirées ---- */
  const addEvent = useCallback(async (d) => {
    const { data, error } = await supabase.from("events").insert({
      event_date: d.date, event_time: d.time, place: d.place, place_id: d.placeId || null, min_players: d.min, max_players: d.max,
      notes: d.notes || "", online: d.online || false, host_id: currentUser.id, deadline: d.deadline || null,
      is_private: !!d.isPrivate, signup_deadline: d.signupDeadline || null,
    }).select().single();
    if (error) return { error: error.message };
    if (d.joinSelf) await supabase.from("event_players").insert({ event_id: data.id, user_id: currentUser.id });
    // invités ajoutés dès la création
    if (d.invites && d.invites.length) {
      await supabase.from("event_guests").insert(
        d.invites.map((inv) => ({ event_id: data.id, guest_name: inv.name, member_id: inv.memberId || null, added_by: currentUser.id }))
      );
      const memberInvites = d.invites.filter((inv) => inv.memberId && inv.memberId !== currentUser.id);
      if (memberInvites.length) {
        await supabase.from("notifications").insert(memberInvites.map((inv) => ({
          recipient_id: inv.memberId, actor_id: currentUser.id, type: "event_invite",
          message: `${currentUser.name} vous a ajouté au moment jeux du ${formatDateFr(d.date)}`,
          link_kind: "event", link_id: data.id,
        })));
      }
    }
    await loadData();
    return { event: data };
  }, [currentUser, loadData]);

  const updateEvent = useCallback(async (id, patch) => {
    const { error } = await supabase.from("events").update({
      event_date: patch.date, event_time: patch.time, place: patch.place, place_id: patch.placeId || null,
      min_players: patch.min, max_players: patch.max, notes: patch.notes || "", online: patch.online || false, deadline: patch.deadline || null,
      is_private: !!patch.isPrivate, signup_deadline: patch.signupDeadline || null,
    }).eq("id", id);
    if (error) return { error: error.message };
    await loadData();
    return {};
  }, [loadData]);

  // ---- Jeux joués lors d'un moment (historique) ----
  // Ajouter un jeu joué : l'utilisateur connecté doit être participant du moment.
  const addPlayedGame = useCallback(async (eventId, gameId) => {
    if (!currentUser) return { error: "Connectez-vous." };
    const { error } = await supabase.from("event_games").insert({ event_id: eventId, game_id: gameId, added_by: currentUser.id });
    if (error) {
      // contrainte unique : déjà ajouté
      if (/duplicate|unique/i.test(error.message)) return { error: "Ce jeu est déjà noté pour ce moment." };
      return { error: error.message };
    }
    await loadData();
    return {};
  }, [currentUser, loadData]);

  // Retirer un jeu joué : seul celui qui l'a ajouté (ou un admin) peut le faire.
  const removePlayedGame = useCallback(async (playedGameId) => {
    if (!currentUser) return;
    await supabase.from("event_games").delete().eq("id", playedGameId);
    await loadData();
  }, [currentUser, loadData]);

  // ============================================================
  // ---- Fiches "À venir" (jeux à sortir / nouveautés) ----
  // ============================================================

  // Créer une fiche À venir
  const addUpcoming = useCallback(async (d) => {
    if (!currentUser) return { error: "Connectez-vous." };
    const imgUrl = await uploadImageToStorage(d.img || "", "upcoming");
    const { data, error } = await supabase.from("upcoming_games").insert({
      name: d.name.trim(), year: d.year || null, min_players: d.min || null, max_players: d.max || null,
      play_time: d.time || null, mechanics: d.mechanics || [], description: d.desc || "", image_url: imgUrl,
      new_price: d.newPrice != null && d.newPrice !== "" ? Number(d.newPrice) : null,
      source: d.source || "manuel", created_by: currentUser.id,
      ludum_url: d.ludumUrl ? d.ludumUrl.trim() : "",
      release_date: d.releaseDate || null, released: !!d.released, vo_released: !!d.voReleased,
    }).select().single();
    if (error) return { error: error.message };
    await loadData();
    return { upcoming: data };
  }, [currentUser, loadData]);

  // Modifier une fiche À venir
  const updateUpcoming = useCallback(async (id, patch) => {
    const fields = {};
    if (patch.name !== undefined) fields.name = patch.name.trim();
    if (patch.year !== undefined) fields.year = patch.year || null;
    if (patch.min !== undefined) fields.min_players = patch.min || null;
    if (patch.max !== undefined) fields.max_players = patch.max || null;
    if (patch.time !== undefined) fields.play_time = patch.time || null;
    if (patch.mechanics !== undefined) fields.mechanics = patch.mechanics || [];
    if (patch.desc !== undefined) fields.description = patch.desc || "";
    if (patch.img !== undefined) fields.image_url = await uploadImageToStorage(patch.img || "", "upcoming");
    if (patch.newPrice !== undefined) fields.new_price = patch.newPrice != null && patch.newPrice !== "" ? Number(patch.newPrice) : null;
    if (patch.ludumUrl !== undefined) fields.ludum_url = patch.ludumUrl ? patch.ludumUrl.trim() : "";
    if (patch.releaseDate !== undefined) fields.release_date = patch.releaseDate || null;
    if (patch.released !== undefined) fields.released = !!patch.released;
    if (patch.voReleased !== undefined) fields.vo_released = !!patch.voReleased;
    // .select() pour confirmer l'écriture : un update bloqué par RLS ne renvoie pas d'erreur
    // mais ne touche aucune ligne — on le détecte ici pour éviter un faux « succès ».
    const { data, error } = await supabase.from("upcoming_games").update(fields).eq("id", id).select("id");
    if (error) return { error: error.message };
    if (!data || data.length === 0) return { error: "Modification impossible : vous n'avez pas les droits sur cette fiche (ou elle n'existe plus)." };
    await loadData();
    return {};
  }, [loadData]);

  // Supprimer une fiche À venir (n'importe quel membre connecté).
  const removeUpcoming = useCallback(async (id) => {
    if (!currentUser) return;
    await supabase.from("upcoming_games").delete().eq("id", id);
    await loadData();
  }, [currentUser, loadData]);

  // Voter / changer / retirer son vote du thermomètre de la hype (1-5)
  const setHype = useCallback(async (upcId, value) => {
    if (!currentUser) return;
    const upc = upcoming.find((u) => u.id === upcId);
    const existing = upc?.hypes?.[currentUser.id];
    if (existing === value) {
      await supabase.from("upcoming_hype").delete().eq("upcoming_id", upcId).eq("user_id", currentUser.id);
    } else {
      await supabase.from("upcoming_hype").upsert({ upcoming_id: upcId, user_id: currentUser.id, value });
    }
    await loadData();
  }, [currentUser, upcoming, loadData]);

  // Définir / retirer son intention d'achat
  const setIntent = useCallback(async (upcId, intent) => {
    if (!currentUser) return;
    const upc = upcoming.find((u) => u.id === upcId);
    const existing = upc?.intents?.[currentUser.id];
    if (existing === intent) {
      await supabase.from("upcoming_intent").delete().eq("upcoming_id", upcId).eq("user_id", currentUser.id);
    } else {
      await supabase.from("upcoming_intent").upsert({ upcoming_id: upcId, user_id: currentUser.id, intent });
    }
    await loadData();
  }, [currentUser, upcoming, loadData]);

  // Commentaires sur une fiche À venir
  const addUpcomingComment = useCallback(async (upcId, content) => {
    if (!currentUser) return { error: "Connectez-vous." };
    if (!content?.trim()) return { error: "Le commentaire est vide." };
    const { error } = await supabase.from("upcoming_comments").insert({
      upcoming_id: upcId, author_id: currentUser.id, content: content.trim().slice(0, 2000),
    });
    if (error) return { error: error.message };
    await loadData();
    return {};
  }, [currentUser, loadData]);

  const updateUpcomingComment = useCallback(async (commentId, content) => {
    if (!currentUser) return { error: "Connectez-vous." };
    if (!content?.trim()) return { error: "Le commentaire est vide." };
    const { error } = await supabase.from("upcoming_comments").update({
      content: content.trim().slice(0, 2000), updated_at: new Date().toISOString(),
    }).eq("id", commentId);
    if (error) return { error: error.message };
    await loadData();
    return {};
  }, [currentUser, loadData]);

  const removeUpcomingComment = useCallback(async (commentId) => {
    if (!currentUser) return;
    await supabase.from("upcoming_comments").delete().eq("id", commentId);
    await loadData();
  }, [currentUser, loadData]);

  // Bouton "Je l'ai !" : crée une fiche ludothèque depuis une fiche À venir,
  // m'y inscrit comme premier propriétaire, et lie la fiche À venir au jeu créé.
  const importUpcomingToLudo = useCallback(async (upcId) => {
    if (!currentUser) return { error: "Connectez-vous." };
    const u = upcoming.find((x) => x.id === upcId);
    if (!u) return { error: "Fiche introuvable." };
    // si déjà liée à une fiche ludo existante, on s'y ajoute juste comme propriétaire
    if (u.ludoGameId) {
      const { error } = await supabase.from("game_owners").insert({ game_id: u.ludoGameId, owner_id: currentUser.id });
      if (error && !/duplicate|unique/i.test(error.message)) return { error: error.message };
      await loadData();
      return { gameId: u.ludoGameId };
    }
    // sinon on crée la fiche ludo à partir des infos À venir
    const imgUrl = await uploadImageToStorage(u.img || "", "games");
    const { data: game, error } = await supabase.from("games").insert({
      name: u.name, year: u.year || null, min_players: u.min || null, max_players: u.max || null,
      play_time: u.time || null, mechanics: u.mechanics || [], description: u.desc || "", image_url: imgUrl,
      new_price: u.newPrice != null ? u.newPrice : null, source: u.source || "manuel", owner_id: currentUser.id,
    }).select().single();
    if (error) return { error: error.message };
    await supabase.from("game_owners").insert({ game_id: game.id, owner_id: currentUser.id, confirmed: true, declared_by: currentUser.id });
    // lier la fiche À venir à la nouvelle fiche ludo
    await supabase.from("upcoming_games").update({ ludo_game_id: game.id }).eq("id", upcId);
    await loadData();
    return { gameId: game.id };
  }, [currentUser, upcoming, loadData]);


  // ---- Invités nommés (membres avec compte OU personnes sans compte) ----
  const addGuest = useCallback(async (eventId, guestName, memberId = null) => {
    if (!currentUser) return { error: "Connectez-vous." };
    const evNow = events.find((e) => e.id === eventId);
    if (!currentUser.admin && isSignupClosed(evNow)) return { error: signupClosedMessage(evNow) };
    const { error } = await supabase.from("event_guests").insert({
      event_id: eventId, guest_name: guestName.trim(), member_id: memberId, added_by: currentUser.id,
    });
    if (error) return { error: /ALADJ_SIGNUP_CLOSED/.test(error.message) ? signupClosedMessage(evNow) : error.message };
    // Inviter un membre => on le prévient ; il confirmera depuis Ma ludothèque (en attente = ambre)
    if (memberId && memberId !== currentUser.id) {
      const ev = events.find((e) => e.id === eventId);
      await supabase.from("notifications").insert({
        recipient_id: memberId, actor_id: currentUser.id, type: "event_invite",
        message: `${currentUser.name} vous a ajouté au moment jeux du ${formatDateFr(ev?.date)}`,
        link_kind: "event", link_id: eventId,
      });
    }
    await loadData();
    return {};
  }, [currentUser, events, loadData]);

  const confirmEventInvite = useCallback(async (guestId) => {
    const { error } = await supabase.rpc("respond_event_invite", { p_guest_id: guestId, p_accept: true });
    if (error) return { error: error.message };
    await loadData();
    return {};
  }, [loadData]);
  const declineEventInvite = useCallback(async (guestId) => {
    const { error } = await supabase.rpc("respond_event_invite", { p_guest_id: guestId, p_accept: false });
    if (error) return { error: error.message };
    await loadData();
    return {};
  }, [loadData]);

  const removeGuest = useCallback(async (guestId) => {
    await supabase.from("event_guests").delete().eq("id", guestId);
    await loadData();
  }, [loadData]);

  // ---- Commentaires de soirée ----
  // Insère des notifications pour une liste de destinataires (en excluant l'acteur lui-même).
  // recipients : tableau d'IDs. On ne notifie jamais l'auteur de l'action.
  const notifyUsers = useCallback(async (recipients, { type, message, linkKind = null, linkId = null }) => {
    if (!currentUser) return;
    const unique = [...new Set(recipients)].filter((id) => id && id !== currentUser.id);
    if (unique.length === 0) return;
    const rows = unique.map((rid) => ({
      recipient_id: rid, actor_id: currentUser.id, type, message,
      link_kind: linkKind, link_id: linkId,
    }));
    await supabase.from("notifications").insert(rows); // best-effort, on n'interrompt pas en cas d'échec
  }, [currentUser]);

  const addComment = useCallback(async (eventId, content) => {
    if (!currentUser) return { error: "Connectez-vous." };
    const { error } = await supabase.from("event_comments").insert({
      event_id: eventId, author_id: currentUser.id, content: content.trim(),
    });
    if (error) return { error: error.message };
    // Notifier les participants du moment (hôte + inscrits), sauf l'auteur du commentaire.
    const ev = events.find((e) => e.id === eventId);
    if (ev) {
      const recipients = [ev.hostId, ...(ev.players || []).map((p) => p.id)];
      await notifyUsers(recipients, {
        type: "event_comment",
        message: `${currentUser.name} a commenté le moment du ${formatDateFr(ev.date)}`,
        linkKind: "event", linkId: eventId,
      });
    }
    await loadData();
    return {};
  }, [currentUser, loadData, events, notifyUsers]);

  const updateComment = useCallback(async (commentId, content) => {
    const { error } = await supabase.from("event_comments").update({
      content: content.trim(), updated_at: new Date().toISOString(),
    }).eq("id", commentId);
    if (error) return { error: error.message };
    await loadData();
    return {};
  }, [loadData]);

  const removeComment = useCallback(async (commentId) => {
    await supabase.from("event_comments").delete().eq("id", commentId);
    await loadData();
  }, [loadData]);

  // ---- Commentaires de jeux (mêmes règles que ceux des moments) ----
  const addGameComment = useCallback(async (gameId, content) => {
    if (!currentUser) return { error: "Connectez-vous." };
    const { error } = await supabase.from("game_comments").insert({ game_id: gameId, author_id: currentUser.id, content: content.trim() });
    if (error) return { error: error.message };
    // Notifier les propriétaires (confirmés) du jeu, sauf l'auteur du commentaire.
    const g = games.find((x) => x.id === gameId);
    if (g) {
      const recipients = g.ownerIds || [];   // fiche de reference = personne a prevenir
      await notifyUsers(recipients, {
        type: "game_comment",
        message: `${currentUser.name} a commenté votre jeu « ${g.name} »`,
        linkKind: "game", linkId: gameId,
      });
    }
    await loadData();
    return {};
  }, [currentUser, loadData, games, notifyUsers]);

  const updateGameComment = useCallback(async (commentId, content) => {
    const { error } = await supabase.from("game_comments").update({ content: content.trim(), updated_at: new Date().toISOString() }).eq("id", commentId);
    if (error) return { error: error.message };
    await loadData();
    return {};
  }, [loadData]);

  const removeGameComment = useCallback(async (commentId) => {
    await supabase.from("game_comments").delete().eq("id", commentId);
    await loadData();
  }, [loadData]);

  // ---- Notifications : marquer lues ----
  // Marque une notification précise comme lue (mise à jour locale immédiate + base).
  const markNotificationRead = useCallback(async (notifId) => {
    setNotifications((prev) => prev.map((n) => n.id === notifId ? { ...n, read: true } : n));
    await supabase.from("notifications").update({ read: true }).eq("id", notifId);
  }, []);

  // Supprime une notification (croix dans « Ma ludothèque »).
  const deleteNotification = useCallback(async (notifId) => {
    setNotifications((prev) => prev.filter((n) => n.id !== notifId));
    await supabase.from("notifications").delete().eq("id", notifId);
  }, []);

  // Marque toutes mes notifications comme lues.
  const markAllNotificationsRead = useCallback(async () => {
    if (!currentUser) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    await supabase.from("notifications").update({ read: true }).eq("recipient_id", currentUser.id).eq("read", false);
  }, [currentUser]);

  // ---- Suggestions : écarter un jeu, en disant pourquoi ----
  // Le motif n'est pas un simple commentaire : c'est lui qui décide si le rejet
  // pénalise les mécaniques, le format, ou absolument rien. « Pas maintenant »
  // pose une date de retour à 90 jours au lieu d'un masquage définitif.
  const dismissReco = useCallback(async (gameId, reason = null) => {
    if (!currentUser) return;
    const snoozeUntil = reason === "later"
      ? new Date(Date.now() + 90 * 86400000).toISOString()
      : null;
    // maj locale immédiate : la vignette disparaît sans attendre le réseau
    setDismissedRecos((prev) => [
      ...prev.filter((d) => d.gameId !== gameId),
      { gameId, reason, snoozeUntil, createdAt: new Date().toISOString() },
    ]);
    await supabase.from("reco_dismissed").upsert(
      { user_id: currentUser.id, game_id: gameId, reason, snooze_until: snoozeUntil },
      { onConflict: "user_id,game_id" },
    );
  }, [currentUser]);

  // Remettre un jeu masqué dans le circuit des suggestions.
  const restoreReco = useCallback(async (gameId) => {
    if (!currentUser) return;
    setDismissedRecos((prev) => prev.filter((d) => d.gameId !== gameId));
    await supabase.from("reco_dismissed").delete().eq("user_id", currentUser.id).eq("game_id", gameId);
  }, [currentUser]);

  // ---- Regroupement familial (foyers) ----
  const reloadGuests = useCallback(async () => {
    if (!currentUserIdRef.current) { setHouseholdGuests([]); return; }
    const { data } = await supabase.rpc("aladj_my_guests");
    setHouseholdGuests(data || []);
  }, []);
  useEffect(() => { reloadGuests(); }, [reloadGuests, currentUser]);

  const addHouseholdGuest = useCallback(async (name) => {
    const n = (name || "").trim();
    if (!n) return { error: "Indiquez un nom." };
    const { error } = await supabase.rpc("aladj_add_guest", { p_name: n });
    if (error) return { error: error.message };
    await reloadGuests();
    return {};
  }, [reloadGuests]);

  const removeHouseholdGuest = useCallback(async (id) => {
    const { error } = await supabase.rpc("aladj_remove_guest", { p_id: id });
    if (error) return { error: error.message };
    await reloadGuests();
    return {};
  }, [reloadGuests]);

  const renameHouseholdGuest = useCallback(async (id, name) => {
    const n = (name || "").trim();
    if (!n) return { error: "Indiquez un nom." };
    const { error } = await supabase.rpc("aladj_rename_guest", { p_id: id, p_name: n });
    if (error) return { error: error.message };
    await reloadGuests();
    return {};
  }, [reloadGuests]);

  const inviteToHousehold = useCallback(async (memberId) => {
    if (!currentUser) return { error: "Connectez-vous." };
    const { error } = await supabase.rpc("household_invite", { p_invitee_id: memberId });
    if (error) return { error: error.message };
    await notifyUsers([memberId], {
      type: "household_invite",
      message: `${currentUser.name} vous invite à rejoindre sa famille`,
      linkKind: "household", linkId: null,
    });
    await loadData();
    return {};
  }, [currentUser, notifyUsers, loadData]);

  const acceptHouseholdInvite = useCallback(async (inviteId) => {
    if (!currentUser) return { error: "Connectez-vous." };
    const { data: inviterId, error } = await supabase.rpc("household_accept", { p_invite_id: inviteId });
    if (error) return { error: error.message };
    if (inviterId) await notifyUsers([inviterId], {
      type: "household_accepted",
      message: `${currentUser.name} a rejoint votre famille`,
      linkKind: "household", linkId: null,
    });
    await loadData();
    return {};
  }, [currentUser, notifyUsers, loadData]);

  const declineHouseholdInvite = useCallback(async (inviteId) => {
    const { data: inviterId, error } = await supabase.rpc("household_decline", { p_invite_id: inviteId });
    if (error) return { error: error.message };
    if (inviterId && currentUser) await notifyUsers([inviterId], {
      type: "household_declined",
      message: `${currentUser.name} a décliné votre invitation à la famille`,
      linkKind: "household", linkId: null,
    });
    await loadData();
    return {};
  }, [currentUser, notifyUsers, loadData]);

  const cancelHouseholdInvite = useCallback(async (inviteId) => {
    const { error } = await supabase.rpc("household_cancel_invite", { p_invite_id: inviteId });
    if (error) return { error: error.message };
    await loadData();
    return {};
  }, [loadData]);

  const leaveHousehold = useCallback(async () => {
    const { error } = await supabase.rpc("household_leave");
    if (error) return { error: error.message };
    await loadData();
    return {};
  }, [loadData]);

  // ---- Lieux réutilisables (partagés entre tous) ----
  const addPlace = useCallback(async (data) => {
    if (!currentUser) return { error: "Connectez-vous." };
    const { data: row, error } = await supabase.from("places").insert({
      name: data.name.trim(), address: data.address?.trim() || "", access_info: data.accessInfo?.trim() || "", created_by: currentUser.id,
    }).select().single();
    if (error) return { error: error.message };
    await loadData();
    return { id: row.id };
  }, [currentUser, loadData]);

  const updatePlace = useCallback(async (id, data) => {
    const { error } = await supabase.from("places").update({
      name: data.name.trim(), address: data.address?.trim() || "", access_info: data.accessInfo?.trim() || "",
    }).eq("id", id);
    if (error) return { error: error.message };
    await loadData();
    return {};
  }, [loadData]);

  const toggleJoin = useCallback(async (eventId) => {
    if (!currentUser) return {};
    const ev = events.find((e) => e.id === eventId);
    const inIt = ev?.players.some((p) => p.id === currentUser.id);
    if (inIt) {
      await supabase.from("event_players").delete().eq("event_id", eventId).eq("user_id", currentUser.id);
    } else {
      // Verrou local (48 h apres le debut / date limite d'inscription) : on evite
      // un aller-retour serveur quand la reponse est deja connue.
      if (!currentUser.admin && isSignupClosed(ev)) {
        await loadData();
        return { error: signupClosedMessage(ev) };
      }
      const { error } = await supabase.from("event_players").insert({ event_id: eventId, user_id: currentUser.id });
      if (error) {
        await loadData();
        return { error: /ALADJ_SIGNUP_CLOSED/.test(error.message) ? signupClosedMessage(ev) : error.message };
      }
    }
    await loadData();
    return {};
  }, [currentUser, events, loadData]);

  // Retirer une inscription d'un moment jeux.
  // Autorisé pour : le créateur du moment, le participant lui-même, un administrateur.
  // (la règle SQL correspondante — policy ep_delete_host_admin — doit être appliquée
  //  pour que le créateur et les admins puissent supprimer la ligne d'un autre membre)
  const removePlayer = useCallback(async (eventId, userId) => {
    if (!currentUser) return { error: "Connectez-vous." };
    const ev = events.find((e) => e.id === eventId);
    const allowed = userId === currentUser.id || currentUser.admin === true || (ev && ev.hostId === currentUser.id);
    if (!allowed) return { error: "Seuls le créateur du moment, le participant lui-même ou un administrateur peuvent retirer une inscription." };
    // .select() pour confirmer l'écriture : un delete bloqué par RLS ne renvoie pas
    // d'erreur mais ne touche aucune ligne — on le détecte ici.
    const { data, error } = await supabase.from("event_players").delete().eq("event_id", eventId).eq("user_id", userId).select("user_id");
    if (error) return { error: error.message };
    if (!data || data.length === 0) return { error: "Retrait impossible : droits insuffisants côté base de données." };
    if (userId !== currentUser.id) {
      await notifyUsers([userId], {
        type: "event_invite",
        message: `${currentUser.name} vous a retiré du moment jeux du ${formatDateFr(ev?.date || "")}`,
        linkKind: "event", linkId: eventId,
      });
    }
    await loadData();
    return {};
  }, [currentUser, events, loadData, notifyUsers]);

  const removeEvent = useCallback(async (id) => { await supabase.from("events").delete().eq("id", id); await loadData(); }, [loadData]);

  // Nombre de "moments jeux" À VENIR créés depuis ma dernière visite de la page
  // Moments (et que je n'ai pas créés moi-même). Sert à la pastille rouge.
  const deciderIds = useMemo(
    () => new Set((users || []).filter((u) => u.role === "decideur").map((u) => u.id)),
    [users]
  );

  // Comptes enfants encore concernés par la tétine (elle disparaît à 14 ans
  // si la date de naissance complète est renseignée).
  const childIds = useMemo(
    () => new Set((users || []).filter((u) => isChildAccount(u)).map((u) => u.id)),
    [users]
  );

  const userById = useMemo(() => {
    const m = {}; (users || []).forEach((u) => { m[u.id] = u; }); return m;
  }, [users]);

  // "Ceinture" : dernier vainqueur connu de chaque jeu (gameId -> { playedAt, winners[] })
  const beltByGame = useMemo(() => {
    const latest = {};
    (plays || []).forEach((pl) => {
      const winners = pl.participants.filter((x) => x.isWinner && x.confirmed !== false);
      if (!winners.length) return;
      const prev = latest[pl.gameId];
      if (!prev || new Date(pl.playedAt) > new Date(prev.playedAt)) {
        latest[pl.gameId] = {
          playedAt: pl.playedAt,
          winners: winners.map((w) => ({
            name: w.name, userId: w.userId,
            avatar: w.userId ? (userById[w.userId]?.avatar || null) : null,
          })),
        };
      }
    });
    return latest;
  }, [plays, userById]);

  // Enregistrer une partie SAISIE MANUELLEMENT (aucun temps pris en compte)
  const recordManualPlay = useCallback(async (gameId, playedAt, participants) => {
    const payload = (participants || []).map((pp) => ({
      user_id: pp.userId || null, guest_name: pp.guestName || null, is_winner: !!pp.isWinner,
      // "" ou null = aucun score saisi pour ce joueur (la RPC enregistre NULL)
      score: pp.score == null || pp.score === "" ? null : Number(pp.score),
    }));
    const { error } = await supabase.rpc("record_manual_play", {
      p_game_id: gameId, p_played_at: playedAt, p_participants: payload,
    });
    if (error) return { error: error.message };
    // Les autres membres impliqués doivent confirmer : on les notifie (pastille + push).
    const others = (participants || []).map((pp) => pp.userId).filter((id) => id && id !== currentUser?.id);
    if (others.length && currentUser) {
      const gName = (games || []).find((g) => g.id === gameId)?.name || "un jeu";
      await notifyUsers(others, {
        type: "play_recorded",
        message: `${currentUser.name} a enregistré une partie de « ${gName} » avec vous — confirmez-la dans Mon espace`,
        linkKind: "game", linkId: gameId,
      });
    }
    await reloadPlays();
    return {};
  }, [reloadPlays, currentUser, games, notifyUsers]);

  const deleteGamePlay = useCallback(async (playId) => {
    const { error } = await supabase.rpc("delete_game_play", { p_play_id: playId });
    if (error) return { error: error.message };
    await reloadPlays();
    return {};
  }, [reloadPlays]);

  // Suggestions : jeux des soirées passées où je suis présent et que je n'ai pas encore enregistrés
  // Vrai quand les données personnelles chargées correspondent bien au membre
  // connecté. Sert de garde à tout ce qui alimente les pastilles.
  const personalReady = !currentUser || personalDataFor === currentUser.id;

  const eventPlaySuggestions = useMemo(() => {
    if (!currentUser || !personalReady) return [];
    const dismissedSet = new Set((eventPlayDismissed || []).map((d) => d.event_id + "|" + d.game_id + "|" + (d.occurrence || 1)));
    const mine = new Set();
    (plays || []).forEach((pl) => {
      if (pl.eventId && pl.participants.some((pt) => pt.userId === currentUser.id)) mine.add(pl.eventId + "|" + pl.gameId + "|" + (pl.occurrence || 1));
    });
    const today = new Date(); today.setHours(23, 59, 59, 999);
    const out = [];
    (events || []).forEach((e) => {
      if (!e.players.some((p) => p.id === currentUser.id)) return;
      if (!e.date || new Date(e.date) > today) return;
      const seen = new Set();
      (e.playedGames || []).forEach((pg) => {
        if (!pg.gameId || seen.has(pg.gameId)) return;
        seen.add(pg.gameId);
        const total = Math.max(1, pg.playCount || 1);
        for (let occ = 1; occ <= total; occ++) {
          const key = e.id + "|" + pg.gameId + "|" + occ;
          if (mine.has(key) || dismissedSet.has(key)) continue;
          out.push({ eventId: e.id, gameId: pg.gameId, gameName: pg.gameName, date: e.date, place: e.place, occurrence: occ, occurrenceTotal: total });
        }
      });
    });
    return out.sort((a, b) => (new Date(b.date) - new Date(a.date)) || (a.gameName || "").localeCompare(b.gameName || "") || a.occurrence - b.occurrence);
  }, [events, plays, eventPlayDismissed, currentUser, personalReady]);

  // Se declarer (ou se retirer) vainqueur d'une partie deja enregistree.
  const setMyPlayResult = useCallback(async (playId, isWinner) => {
    if (!currentUser) return;
    const { error } = await supabase.rpc("set_my_play_result", { p_play_id: playId, p_is_winner: !!isWinner });
    if (error) { console.error("set_my_play_result:", error.message); return { error: error.message }; }
    await reloadPlays();
    return {};
  }, [currentUser, reloadPlays]);

  // Parties manuelles où un autre membre m'a inscrit : en attente de MA confirmation.
  const myPendingPlays = useMemo(() => {
    if (!currentUser || !personalReady) return [];
    return (plays || [])
      .filter((pl) => pl.participants.some((pt) => pt.userId === currentUser.id && pt.confirmed === false))
      .sort((a, b) => new Date(b.playedAt) - new Date(a.playedAt));
  }, [plays, currentUser, personalReady]);

  const confirmPlayParticipation = useCallback(async (playId, isWinner) => {
    const { error } = await supabase.rpc("confirm_play_participation", { p_play_id: playId, p_is_winner: !!isWinner });
    if (error) return { error: error.message };
    await reloadPlays();
    return {};
  }, [reloadPlays]);

  // Retirer une partie de mon historique.
  // Si la partie provient d'un moment jeux, on enregistre AUSSI un « non » dans
  // event_play_dismissed : sans cela, la suggestion « as-tu joue a X ? » revenait
  // aussitot dans « Parties a confirmer », comme si le retrait n'avait pas eu lieu.
  const declinePlayParticipation = useCallback(async (playId) => {
    const pl = (plays || []).find((p) => p.id === playId);
    const { error } = await supabase.rpc("decline_play_participation", { p_play_id: playId });
    if (error) return { error: error.message };
    if (pl && pl.eventId && pl.gameId && currentUser) {
      const row = { user_id: currentUser.id, event_id: pl.eventId, game_id: pl.gameId, occurrence: pl.occurrence || 1 };
      const { error: dErr } = await supabase.from("event_play_dismissed").insert(row);
      if (!dErr || /duplicate|unique/i.test(dErr.message)) {
        setEventPlayDismissed((prev) => (
          prev.some((d) => d.event_id === row.event_id && d.game_id === row.game_id && (d.occurrence || 1) === row.occurrence)
            ? prev : [...prev, row]
        ));
      }
    }
    await reloadPlays();
    return {};
  }, [plays, currentUser, reloadPlays]);

  const confirmEventPlay = useCallback(async (eventId, gameId, occurrence, isWinner) => {
    const { error } = await supabase.rpc("confirm_event_play", { p_event_id: eventId, p_game_id: gameId, p_occurrence: occurrence || 1, p_is_winner: !!isWinner });
    if (error) return { error: error.message };
    await reloadPlays();
    return {};
  }, [reloadPlays]);

  const dismissEventPlay = useCallback(async (eventId, gameId, occurrence) => {
    if (!currentUser) return { error: "Non connecté" };
    const occ = occurrence || 1;
    const { error } = await supabase.from("event_play_dismissed").insert({ user_id: currentUser.id, event_id: eventId, game_id: gameId, occurrence: occ });
    if (error && !/duplicate|unique/i.test(error.message)) return { error: error.message };
    setEventPlayDismissed((prev) => [...prev, { user_id: currentUser.id, event_id: eventId, game_id: gameId, occurrence: occ }]);
    return {};
  }, [currentUser]);

  // Regler le nombre de parties d'un jeu joue lors d'un moment.
  const setEventPlayCount = useCallback(async (playedGameId, count) => {
    if (!currentUser) return;
    const { error } = await supabase.rpc("set_event_play_count", { p_event_game_id: playedGameId, p_count: count });
    if (error) { console.error("set_event_play_count:", error.message); return { error: error.message }; }
    await loadData();
    return {};
  }, [currentUser, loadData]);

  const momentsUnseen = useMemo(() => {
    if (!currentUser) return 0;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const seen = currentUser.momentsSeenAt ? new Date(currentUser.momentsSeenAt).getTime() : 0;
    return (events || []).filter((e) => {
      if (!e.date || e.hostId === currentUser.id) return false;
      if (!canViewEvent(e, currentUser)) return false;
      const d = new Date(e.date);
      if (isNaN(d.getTime())) return false;
      return d >= today && (e.createdAt || 0) > seen;
    }).length;
  }, [events, currentUser]);

  // Marque la page Moments comme consultée (efface la pastille des moments).
  const markMomentsSeen = useCallback(async () => {
    if (!currentUser) return;
    const ts = new Date().toISOString();
    setCurrentUser((u) => (u ? { ...u, momentsSeenAt: ts } : u));
    await supabase.from("profiles").update({ moments_seen_at: ts }).eq("id", currentUser.id);
  }, [currentUser]);

  // Pastille rouge sur l'icône de l'app installée (PWA) = nb de notifications non lues.
  // Note : se met à jour quand l'app est ouverte ; un vrai temps réel "app fermée"
  // demanderait des notifications push (service worker).
  useEffect(() => {
    const count = (notifications || []).filter((n) => !n.read).length;
    try {
      if ("setAppBadge" in navigator) {
        if (count > 0) navigator.setAppBadge(count).catch(() => {});
        else if ("clearAppBadge" in navigator) navigator.clearAppBadge().catch(() => {});
      }
    } catch (e) { /* API non supportée : on ignore */ }
  }, [notifications]);

  // ---- Notifications push (abonnement de cet appareil) ----
  const [pushEnabled, setPushEnabled] = useState(false);
  const pushSupported = typeof navigator !== "undefined" && "serviceWorker" in navigator
    && typeof window !== "undefined" && "PushManager" in window && "Notification" in window;

  // Enregistre le service worker et détecte un abonnement déjà actif
  useEffect(() => {
    if (!pushSupported) return;
    navigator.serviceWorker.register("/sw.js").then(async () => {
      try {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        setPushEnabled(!!sub);
      } catch (e) { /* ignore */ }
    }).catch(() => {});
  }, [pushSupported]);

  const enablePush = useCallback(async () => {
    if (!pushSupported) return { error: "Cet appareil ou navigateur ne gère pas les notifications push." };
    if (!currentUser) return { error: "Connectez-vous d'abord." };
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") return { error: "Les notifications ont été refusées dans le navigateur." };
      const reg = await navigator.serviceWorker.ready;
      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        });
      }
      const j = sub.toJSON();
      const { error } = await supabase.from("push_subscriptions").upsert({
        user_id: currentUser.id, endpoint: j.endpoint, p256dh: j.keys.p256dh, auth: j.keys.auth,
        user_agent: navigator.userAgent,
      }, { onConflict: "endpoint" });
      if (error) return { error: error.message };
      setPushEnabled(true);
      return {};
    } catch (e) { return { error: e.message || String(e) }; }
  }, [pushSupported, currentUser]);

  const disablePush = useCallback(async () => {
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await supabase.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
        await sub.unsubscribe();
      }
      setPushEnabled(false);
      return {};
    } catch (e) { return { error: e.message || String(e) }; }
  }, []);

  // Confirmation universelle (promise-based) : remplace window.confirm.
  const [confirmState, setConfirmState] = useState(null);
  const confirmResolveRef = useRef(null);
  const askConfirm = useCallback((opts) => new Promise((resolve) => {
    const o = typeof opts === "string" ? { message: opts } : (opts || {});
    confirmResolveRef.current = resolve;
    setConfirmState(o);
  }), []);
  const closeConfirm = useCallback((result) => {
    setConfirmState(null);
    const r = confirmResolveRef.current;
    confirmResolveRef.current = null;
    if (r) r(result);
  }, []);

  const value = {
    ready, fatalError, users, games, events, places, loans, myWeights, upcoming, currentUser,
    register, login, logout, addGame, updateGame, removeGame, rateGame, clearRating,
    loginWithGoogle,
    toggleGameShared, setShareLibrary, addOwner, removeOwner, declareOwners, updateProfile,
    confirmOwnership, declineOwnership, toggleDiscover,
    banUser, unbanUser, deleteUser, adminAddMembershipDays, adminRevokeMembership, memberEmails, bannedNotice, setBannedNotice,
    notifications, markNotificationRead, markAllNotificationsRead, deleteNotification,
    momentsUnseen, markMomentsSeen, deciderIds, childIds,
    plays, beltByGame, recordManualPlay, deleteGamePlay, setMyPlayResult,
    eventPlaySuggestions, confirmEventPlay, dismissEventPlay, personalReady, setEventPlayCount,
    myPendingPlays, confirmPlayParticipation, declinePlayParticipation,
    pushSupported, pushEnabled, enablePush, disablePush,
    dismissedRecos, dismissReco, restoreReco,
    setRetroEmails,
    household, householdByUser, householdGuests, addHouseholdGuest, removeHouseholdGuest, renameHouseholdGuest, inviteToHousehold, acceptHouseholdInvite, declineHouseholdInvite, cancelHouseholdInvite, leaveHousehold,
    addExtension, addExtensionOwner, removeExtensionOwner, declareExtensionOwners, confirmExtensionOwnership,
    setGameWeight, createLoan, closeLoan,
    addEvent, updateEvent, toggleJoin, removePlayer, removeEvent, addPlayedGame, removePlayedGame,
    addGuest, removeGuest, confirmEventInvite, declineEventInvite, addComment, updateComment, removeComment,
    addGameComment, updateGameComment, removeGameComment,
    addPlace, updatePlace,
    addUpcoming, updateUpcoming, removeUpcoming, setHype, setIntent,
    addUpcomingComment, updateUpcomingComment, removeUpcomingComment, importUpcomingToLudo,
    reload: loadData,
    resetPassword, updatePassword, passwordRecovery, setPasswordRecovery,
    chrono, openChrono, closeChrono,
    askConfirm,
  };
  return <AppCtx.Provider value={value}>{children}<ConfirmDialog state={confirmState} onClose={closeConfirm} /></AppCtx.Provider>;
}

function gameStats(g) {
  const vals = Object.values(g.ratings || {});
  const count = vals.length;
  return { count, avg: count ? vals.reduce((a, b) => a + b, 0) / count : 0 };
}

// Une soirée est visible sauf si sa date limite (deadline) est passée
// ET que le quorum (min joueurs) n'est pas atteint.
function isEventVisible(e) {
  if (!e.deadline) return true; // pas de limite → toujours visible
  const now = Date.now();
  const limit = new Date(e.deadline).getTime();
  if (now < limit) return true; // limite pas encore atteinte
  const totalPlayers = (e.players?.length || 0) + (e.guests?.length || 0);
  return totalPlayers >= e.min; // après la limite : visible seulement si quorum atteint
}

// ---- Moments jeux PRIVÉS ----
// Un membre est « convié » à un moment : il l'a créé, il y est inscrit,
// ou il figure parmi les invités nommés (invitation en attente comprise).
function isEventInvited(e, u) {
  if (!e || !u) return false;
  if (e.hostId === u.id) return true;
  if ((e.players || []).some((p) => p.id === u.id)) return true;
  return (e.guests || []).some((g) => g.memberId === u.id);
}
// Qui peut voir un moment : tout le monde s'il est public ;
// seulement les conviés et les administrateurs s'il est privé.
function canViewEvent(e, u) {
  if (!e || !e.isPrivate) return true;
  if (!u) return false;
  return isEventInvited(e, u) || u.admin === true;
}
// Un moment privé s'affiche en grisé pour un administrateur qui n'y est pas convié :
// il le voit et peut agir dessus, mais il est visuellement mis à part.
function isEventDimmed(e, u) {
  return !!(e && e.isPrivate && u && u.admin === true && !isEventInvited(e, u));
}

// Un moment est « annulé » quand sa date limite de validation est passée
// sans que le quorum (min joueurs) ne soit atteint. Prolonger le délai
// (créateur ou admin) le réactive automatiquement.
function isEventExpired(e) {
  if (!e?.deadline) return false;
  if (Date.now() < new Date(e.deadline).getTime()) return false;
  const total = (e.players?.length || 0) + (e.guests?.length || 0);
  return total < e.min;
}

// ---- Fenetre d'inscription a un moment jeux ----
// Deux verrous se cumulent, le plus proche l'emporte :
//   * 48 h APRES le debut du moment : plus aucun ajout possible (regle fixe) ;
//   * la date/heure limite d'inscription fixee par le createur (facultative).
const SIGNUP_LOCK_HOURS = 48;
function eventStartAt(e) {
  if (!e || !e.date) return null;
  const t = (e.time || "00:00").slice(0, 5);
  const d = new Date(`${e.date}T${t}:00`);
  return isNaN(d.getTime()) ? null : d;
}
// Instant exact de fermeture des inscriptions (null = jamais).
function signupCloseAt(e) {
  const start = eventStartAt(e);
  const lock = start ? new Date(start.getTime() + SIGNUP_LOCK_HOURS * 3600 * 1000) : null;
  const manual = e && e.signupDeadline ? new Date(e.signupDeadline) : null;
  const valid = [lock, manual].filter((d) => d && !isNaN(d.getTime()));
  if (!valid.length) return null;
  return new Date(Math.min(...valid.map((d) => d.getTime())));
}
// Message affiche quand une inscription est refusee.
function signupClosedMessage(e) {
  const at = signupCloseAt(e);
  if (signupClosedReason(e) === "deadline") {
    return `Les inscriptions à ce moment jeux sont closes depuis le ${formatDateTimeFr(at)} (date limite fixée par l'organisateur).`;
  }
  return `Les inscriptions à ce moment jeux sont closes : plus aucun ajout n'est possible ${SIGNUP_LOCK_HOURS} h après son début.`;
}
function isSignupClosed(e) {
  const c = signupCloseAt(e);
  return !!c && Date.now() > c.getTime();
}
// Raison de la fermeture, pour l'affichage.
function signupClosedReason(e) {
  const start = eventStartAt(e);
  const manual = e && e.signupDeadline ? new Date(e.signupDeadline) : null;
  if (manual && Date.now() > manual.getTime()) {
    const lock = start ? new Date(start.getTime() + SIGNUP_LOCK_HOURS * 3600 * 1000) : null;
    if (!lock || manual <= lock) return "deadline";
  }
  return "lock48";
}
function formatDateTimeFr(d) {
  if (!d) return "";
  return `${formatDateFr(d.toISOString().slice(0, 10))} à ${String(d.getHours()).padStart(2, "0")}h${String(d.getMinutes()).padStart(2, "0")}`;
}

/* Motifs proposés quand on écarte une suggestion. `weight` dit ce que le moteur
   en fait : "mech" pénalise les mécaniques du jeu, "format" sa fourchette de
   joueurs et sa durée, "none" n'apprend rien (le jeu est simplement masqué).
   Un rejet pesant moitié moins qu'une vraie note : avec un effectif modeste,
   ces signaux sont statistiquement fragiles et ne doivent pas dominer. */
const RECO_REASONS = [
  { key: "mechanics",       label: "Les mécaniques ne me tentent pas", hint: "On évitera ces mécaniques dans vos prochaines suggestions.", weight: "mech" },
  { key: "format",          label: "Le format ne me convient pas",     hint: "Nombre de joueurs ou durée : on s'en éloignera.",             weight: "format" },
  { key: "played_disliked", label: "J'y ai déjà joué, je n'ai pas aimé", hint: "Mettez-lui plutôt une note : c'est le signal le plus fort.", weight: "mech" },
  { key: "theme",           label: "Le thème ne m'attire pas",         hint: "Ce jeu seul est écarté, sans conséquence sur les autres.",   weight: "none" },
  { key: "known",           label: "Je le connais déjà",               hint: "Simple masquage : vos goûts ne changent pas.",              weight: "none" },
  { key: "later",           label: "Pas maintenant",                   hint: "Il reviendra dans 90 jours.",                                weight: "none" },
  { key: "none",            label: "Sans raison",                      hint: "Masqué, sans rien apprendre.",                               weight: "none" },
];
const RECO_REASON_LABEL = (k) => (RECO_REASONS.find((r) => r.key === k) || {}).label || "Sans motif";

// Un rejet est-il encore actif ? (« Pas maintenant » expire au bout de 90 jours)
function isRecoDismissalActive(d, now = Date.now()) {
  if (!d) return false;
  if (!d.snoozeUntil) return true;
  return new Date(d.snoozeUntil).getTime() > now;
}

// Moteur de recommandations : propose des jeux non notés par l'utilisateur,
// en combinant (a) les goûts des membres aux profils proches, (b) les mécaniques
// qu'il aime, (c) ce qu'il a explicitement écarté et pourquoi.
function recommendGames(games, currentUserId, dismissals = [], limit = 12) {
  if (!currentUserId) return [];
  const myRatings = {}; // gameId -> ma note
  games.forEach((g) => { const v = g.ratings?.[currentUserId]; if (v) myRatings[g.id] = v; });
  const ratedIds = new Set(Object.keys(myRatings));

  // --- (a) Similarité entre membres : qui note comme moi sur les jeux qu'on a en commun ?
  const otherUsers = {};
  games.forEach((g) => {
    Object.entries(g.ratings || {}).forEach(([uid, val]) => {
      if (uid === currentUserId) return;
      (otherUsers[uid] ||= []).push({ gameId: g.id, val });
    });
  });
  const similarity = {}; // uid -> score de proximité (0..1)
  Object.entries(otherUsers).forEach(([uid, theirRatings]) => {
    let sum = 0, n = 0;
    theirRatings.forEach(({ gameId, val }) => {
      if (myRatings[gameId] != null) { sum += Math.abs(myRatings[gameId] - val); n++; }
    });
    // proximité = inverse de l'écart moyen (sur échelle 0-5) ; n>0 requis
    if (n > 0) similarity[uid] = 1 - (sum / n) / 5;
  });

  // --- (b) Mécaniques que j'apprécie (jeux notés ≥ 4) ET que je n'aime pas (jeux notés ≤ 2)
  const likedMech = {};
  const dislikedMech = {};
  games.forEach((g) => {
    const r = myRatings[g.id] || 0;
    if (r >= 4) (g.mechanics || []).forEach((m) => { likedMech[m] = (likedMech[m] || 0) + 1; });
    else if (r > 0 && r <= 2) (g.mechanics || []).forEach((m) => { dislikedMech[m] = (dislikedMech[m] || 0) + 1; });
  });
  // Les rejets motivés « mécaniques » ou « déjà joué, pas aimé » nourrissent la
  // liste des mécaniques à fuir, avec un poids de 0,5 (une vraie note pese 1).
  const byId = {};
  games.forEach((g) => { byId[g.id] = g; });
  const dismissRows = (dismissals || []).map((d) => (typeof d === "string" ? { gameId: d, reason: null, snoozeUntil: null } : d));
  const rejPlayers = [], rejTimes = [];
  dismissRows.forEach((d) => {
    const spec = RECO_REASONS.find((r) => r.key === d.reason);
    const g = byId[d.gameId];
    if (!spec || !g) return;
    if (spec.weight === "mech") {
      (g.mechanics || []).forEach((m) => { dislikedMech[m] = (dislikedMech[m] || 0) + 0.5; });
    } else if (spec.weight === "format") {
      const mid = g.min && g.max ? (Number(g.min) + Number(g.max)) / 2 : (Number(g.min) || Number(g.max) || 0);
      if (mid > 0) rejPlayers.push(mid);
      if (Number(g.time) > 0) rejTimes.push(Number(g.time));
    }
  });

  const maxMech = Math.max(1, ...Object.values(likedMech));

  // --- (c) Format préféré : nombre de joueurs et durée de mes jeux bien notés (≥ 4)
  //     On calcule une fourchette "habituelle" pour donner un petit bonus aux jeux similaires.
  const likedPlayers = [];
  const likedTimes = [];
  games.forEach((g) => {
    if ((myRatings[g.id] || 0) >= 4) {
      const mid = g.min && g.max ? (Number(g.min) + Number(g.max)) / 2 : (Number(g.min) || Number(g.max) || 0);
      if (mid > 0) likedPlayers.push(mid);
      if (Number(g.time) > 0) likedTimes.push(Number(g.time));
    }
  });
  const avg = (arr) => arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : 0;
  const prefPlayers = avg(likedPlayers); // 0 si pas de signal
  const prefTime = avg(likedTimes);

  // --- (d) Envies de découvrir des membres proches (signal social)
  //     Pour chaque jeu, on regarde si des membres qui me ressemblent veulent le découvrir.
  const discoverPeerScore = (g) => {
    const wanters = g.wantIds || [];
    if (wanters.length === 0) return 0;
    let s = 0;
    wanters.forEach((uid) => { if (uid !== currentUserId) s += (similarity[uid] || 0.3); });
    return Math.min(1, s / 3); // plafonné : 3 membres proches qui le veulent = score max
  };

  // --- Score de chaque jeu candidat (non noté par moi)
  // Candidats : jeux que je n'ai pas notés, que je ne possède pas déjà,
  // pour lesquels je n'ai pas déjà exprimé une envie de découvrir,
  // et que je n'ai pas rejetés ("ça ne m'intéresse pas").
  const nowMs = Date.now();
  const dismissed = new Set(dismissRows.filter((d) => isRecoDismissalActive(d, nowMs)).map((d) => d.gameId));
  const candidates = games.filter((g) =>
    !ratedIds.has(g.id)
    && !g.unowned                                  // inutile de conseiller un jeu que personne n'a
    && !(g.ownerIds || []).includes(currentUserId)
    && !(g.wantIds || []).includes(currentUserId)
    && !dismissed.has(g.id)
  );
  const scored = candidates.map((g) => {
    // composante "profils similaires" : moyenne pondérée des notes des autres par leur proximité
    let wSum = 0, wTot = 0;
    Object.entries(g.ratings || {}).forEach(([uid, val]) => {
      if (uid === currentUserId) return;
      const sim = similarity[uid];
      if (sim != null && sim > 0) { wSum += sim * val; wTot += sim; }
    });
    const peerScore = wTot > 0 ? (wSum / wTot) / 5 : 0; // 0..1

    // composante "mécaniques aimées" moins "mécaniques détestées"
    const mechHits = (g.mechanics || []).reduce((s, m) => s + (likedMech[m] || 0), 0);
    const mechMiss = (g.mechanics || []).reduce((s, m) => s + (dislikedMech[m] || 0), 0);
    const mechScore = Math.max(0, Math.min(1, (mechHits - mechMiss * 0.7) / (maxMech * 2))); // 0..1, pénalisé

    // score de base : dominante profils (0.7) + appoint mécaniques (0.3)
    const globalAvg = gameStats(g).avg / 5;
    let base = wTot > 0 ? (0.7 * peerScore + 0.3 * mechScore) : (0.5 * mechScore + 0.3 * globalAvg);

    // bonus additif "format préféré" (15% max) : proximité du nb de joueurs et de la durée
    let formatBonus = 0;
    if (prefPlayers > 0 && (g.min || g.max)) {
      const mid = g.min && g.max ? (Number(g.min) + Number(g.max)) / 2 : (Number(g.min) || Number(g.max));
      const diff = Math.abs(mid - prefPlayers);
      formatBonus += 0.075 * Math.max(0, 1 - diff / 4); // 4 joueurs d'écart = bonus nul
    }
    if (prefTime > 0 && Number(g.time) > 0) {
      const diff = Math.abs(Number(g.time) - prefTime);
      formatBonus += 0.075 * Math.max(0, 1 - diff / 90); // 90 min d'écart = bonus nul
    }

    // malus "format déjà refusé" : on s'éloigne des fourchettes explicitement écartées
    let formatMalus = 0;
    if (rejPlayers.length > 0 && (g.min || g.max)) {
      const mid = g.min && g.max ? (Number(g.min) + Number(g.max)) / 2 : (Number(g.min) || Number(g.max));
      const close = Math.max(...rejPlayers.map((v) => Math.max(0, 1 - Math.abs(mid - v) / 2)));
      formatMalus += 0.08 * close;
    }
    if (rejTimes.length > 0 && Number(g.time) > 0) {
      const close = Math.max(...rejTimes.map((v) => Math.max(0, 1 - Math.abs(Number(g.time) - v) / 45)));
      formatMalus += 0.08 * close;
    }

    // bonus social "envie de découvrir des pairs"
    const discoverBonus = 0.1 * discoverPeerScore(g);

    const score = base + formatBonus + discoverBonus - formatMalus;

    // raison principale affichée à l'utilisateur (explication de la reco)
    let reason = "";
    if (wTot > 0 && peerScore >= mechScore) reason = "Apprécié par des membres proches de vous";
    else if (mechHits > 0) {
      const topMech = (g.mechanics || []).filter((m) => likedMech[m]).sort((a, b) => (likedMech[b] || 0) - (likedMech[a] || 0))[0];
      reason = topMech ? `Vous aimez les jeux « ${topMech} »` : "Correspond à vos goûts";
    } else if (discoverPeerScore(g) > 0) reason = "Des membres proches veulent le découvrir";
    else reason = "Bien noté par l'association";

    return { game: g, score, reason, mechanics: g.mechanics || [], hasSignal: wTot > 0 || mechHits > 0 || discoverPeerScore(g) > 0 };
  });

  // on ne garde que les jeux avec un vrai signal et un score positif
  const pool = scored.filter((s) => s.hasSignal && s.score > 0).sort((a, b) => b.score - a.score);

  // --- Diversité douce (MMR à 15%) : on construit la liste un jeu à la fois,
  //     en pénalisant légèrement les jeux trop semblables (mêmes mécaniques) à ceux déjà choisis.
  const DIVERSITY = 0.15;
  const selected = [];
  const remaining = [...pool];
  while (selected.length < limit && remaining.length > 0) {
    let bestIdx = 0, bestVal = -Infinity;
    for (let i = 0; i < remaining.length; i++) {
      const cand = remaining[i];
      // similarité max avec un jeu déjà sélectionné = proportion de mécaniques partagées
      let maxSim = 0;
      selected.forEach((sel) => {
        const setA = new Set(cand.mechanics);
        const shared = sel.mechanics.filter((m) => setA.has(m)).length;
        const denom = Math.max(1, Math.min(cand.mechanics.length, sel.mechanics.length));
        maxSim = Math.max(maxSim, shared / denom);
      });
      const adjusted = cand.score - DIVERSITY * maxSim;
      if (adjusted > bestVal) { bestVal = adjusted; bestIdx = i; }
    }
    selected.push(remaining.splice(bestIdx, 1)[0]);
  }

  // Filet de sécurité : dans une ludothèque finie, le vivier « avec signal »
  // peut ne pas remplir les 12 cases. On complète avec les jeux les mieux notés
  // de l'association, étiquetés comme tels pour rester honnête sur l'origine.
  if (selected.length < limit) {
    const already = new Set(selected.map((x) => x.game.id));
    scored
      .filter((x) => !already.has(x.game.id) && gameStats(x.game).count > 0)
      .sort((a, b) => gameStats(b.game).avg - gameStats(a.game).avg)
      .slice(0, limit - selected.length)
      .forEach((x) => selected.push({ ...x, reason: "Bien noté par l'association" }));
  }

  // on renvoie les jeux enrichis de leur "raison" (pour l'affichage)
  return selected.map((s) => ({ ...s.game, _recoReason: s.reason }));
}
/* =============================================================================
   COMPOSANTS UI
   ============================================================================= */

/* ---- Logo / Wordmark ALADJ ---- */
function Wordmark({ size = 28 }) {
  const letters = [
    { ch: "A", c: C.navy }, { ch: "L", c: C.teal }, { ch: "A", c: C.amber },
    { ch: "D", c: C.red }, { ch: "J", c: C.purple },
  ];
  return (
    <span style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700, fontSize: size, letterSpacing: "-0.02em", lineHeight: 1, display: "inline-flex" }}>
      {letters.map((l, i) => <span key={i} style={{ color: l.c }}>{l.ch}</span>)}
    </span>
  );
}

function MeepleIcon({ size = 22, color = C.navy }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} aria-hidden>
      <path d="M12 2c-1.3 0-2.4 1-2.4 2.3 0 .7.3 1.3.8 1.7-1.1.4-2 .9-3.3 1.6-1 .5-1.6 1.1-1.6 2 0 .8.6 1.4 1.4 1.4.5 0 1-.2 1.7-.5.6-.3 1.2-.5 1.2.2 0 .5-.4 1.2-1.2 2.4-.9 1.4-1.6 2.5-1.6 3.6 0 .8.6 1.6 2 1.6h6c1.4 0 2-.8 2-1.6 0-1.1-.7-2.2-1.6-3.6-.8-1.2-1.2-1.9-1.2-2.4 0-.7.6-.5 1.2-.2.7.3 1.2.5 1.7.5.8 0 1.4-.6 1.4-1.4 0-.9-.6-1.5-1.6-2-1.3-.7-2.2-1.2-3.3-1.6.5-.4.8-1 .8-1.7C14.4 3 13.3 2 12 2z" />
    </svg>
  );
}

/* ---- Étoiles de notation ---- */
/* ---- Encart : échelle de notation (réutilisé en ludothèque générale et perso) ---- */
/* Echelle de notation ALADJ — source unique, utilisee par l'encart et la fenetre. */
const RATING_SCALE = [
  { v: 5,   t: "j'y joue encore et encore (j'adore)" },
  { v: 4,   t: "j'y joue avec plaisir" },
  { v: 3,   t: "j'y joue si on me le propose" },
  { v: 2,   t: "j'y joue pour faire plaisir" },
  { v: 1,   t: "j'y joue à contre-cœur" },
  { v: 0.5, t: "je n'y rejouerai jamais" },
];
const RATING_SCALE_INTRO = "Juger la qualité « objective » d'un jeu est difficile, mais on sait facilement si on a envie d'y rejouer. Notre échelle reflète cette envie :";

/* Fenetre « Notre notation » — rappel de l'echelle, ouvrable depuis une fiche de jeu. */
function RatingScaleModal({ onClose }) {
  return (
    <Modal open onClose={onClose} title="\u2b50 Notre notation" width={520}>
      <p style={{ fontSize: 14, color: "#5e5346", margin: "0 0 16px", lineHeight: 1.6 }}>{RATING_SCALE_INTRO}</p>
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr)", gap: 10 }}>
        {RATING_SCALE.map((sc) => (
          <div key={sc.v} style={{ display: "flex", alignItems: "center", gap: 12, background: "rgba(232,163,23,.08)", border: "1px solid rgba(232,163,23,.25)", borderRadius: 12, padding: "10px 14px", flexWrap: "wrap" }}>
            <span style={{ flexShrink: 0, width: 112 }}><Stars value={sc.v} readOnly size={15} /></span>
            <span style={{ flex: 1, minWidth: 140, fontSize: 14, color: "#5e5346" }}>{sc.t}</span>
            <span style={{ flexShrink: 0, fontFamily: "'Fredoka',sans-serif", fontWeight: 700, color: C.amber, fontSize: 15 }}>{String(sc.v).replace(".", ",")}</span>
          </div>
        ))}
      </div>
      <p style={{ fontSize: 13, color: "#8a7c6a", margin: "16px 0 0", lineHeight: 1.55 }}>
        La demi-étoile est autorisée : on peut noter 2,5 ou 4,5. La note affichée sur la fiche est la <b>moyenne</b> des notes des membres.
      </p>
    </Modal>
  );
}

/* Petite liste cliquable reutilisable (extensions, jeux notes, ...). */
function PickListModal({ title, subtitle, rows, empty, onClose, width = 520 }) {
  return (
    <Modal open onClose={onClose} title={title} width={width}>
      {subtitle && <p style={{ margin: "0 0 14px", fontSize: 13.5, color: "#8a7c6a", lineHeight: 1.55 }}>{subtitle}</p>}
      {rows.length === 0 ? (
        <div style={{ color: "#9c8d79", fontSize: 14, padding: "10px 0" }}>{empty}</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr)", gap: 7, maxHeight: "58vh", overflowY: "auto", padding: 2 }}>
          {rows.map((r, i) => (
            <button key={r.key} type="button" onClick={r.onClick} title={r.title || "Ouvrir la fiche du jeu"}
              style={{ display: "flex", alignItems: "center", gap: 11, background: "#fff", border: "1px solid #efe6d6", borderRadius: 12, padding: "9px 12px", cursor: "pointer", textAlign: "left", width: "100%", minWidth: 0, font: "inherit" }}
              onMouseEnter={(e) => e.currentTarget.style.background = "rgba(30,138,138,.06)"} onMouseLeave={(e) => e.currentTarget.style.background = "#fff"}>
              <span style={{ width: 22, flexShrink: 0, textAlign: "right", color: "#c3b49b", fontFamily: "'Fredoka',sans-serif", fontWeight: 700, fontSize: 13 }}>{i + 1}</span>
              <span style={{ width: 40, height: 40, borderRadius: 9, flexShrink: 0, display: "grid", placeItems: "center", background: r.img ? `center/cover url("${r.img}")` : `linear-gradient(135deg,${C.teal},${C.purple})` }}>
                {!r.img && <span style={{ fontSize: 16 }}>{r.emoji || "\ud83c\udfb2"}</span>}
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: "block", fontFamily: "'Fredoka',sans-serif", fontWeight: 600, color: C.navy, fontSize: 14.5, lineHeight: 1.25, overflowWrap: "anywhere" }}>{r.name}</span>
                {r.sub && <span style={{ display: "block", fontSize: 12, color: "#9c8d79", marginTop: 2 }}>{r.sub}</span>}
              </span>
              {r.right}
              <ChevronRight size={16} color="#c3b49b" style={{ flexShrink: 0 }} />
            </button>
          ))}
        </div>
      )}
    </Modal>
  );
}

/* -----------------------------------------------------------------------------
   POINTS DE REGLE
   Memoire commune de la table : chaque membre peut consigner une precision de
   regle sur un jeu (« on ne pioche qu'une fois par tour », « la variante X se
   joue ainsi »...). Chacun corrige ou supprime ses propres points ; les
   administrateurs peuvent intervenir sur tous.
   La liste est chargee a la demande (table game_rules), pas au demarrage du
   site : inutile de la transporter partout.
   ----------------------------------------------------------------------------- */
function GameRulesModal({ gameId, gameName, onClose, onCount }) {
  const { currentUser, users, askConfirm } = useApp();
  const [rows, setRows] = useState(null);      // null = chargement en cours
  const [err, setErr] = useState("");
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const [editId, setEditId] = useState(null);
  const [editText, setEditText] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const { data, error } = await supabase.from("game_rules")
      .select("id,game_id,author_id,content,created_at,updated_at")
      .eq("game_id", gameId).order("created_at", { ascending: true });
    if (error) { setErr(error.message); setRows([]); return; }
    setRows(data || []);
    if (onCount) onCount((data || []).length);
  }, [gameId, onCount]);
  useEffect(() => { load(); }, [load]);

  const nameOf = (id) => (users || []).find((u) => u.id === id)?.name || "Un membre";
  const canTouch = (r) => !!currentUser && (r.author_id === currentUser.id || currentUser.admin === true);

  const submitNew = async () => {
    const txt = draft.trim();
    if (!txt || !currentUser) return;
    setBusy(true); setErr("");
    const { error } = await supabase.from("game_rules").insert({ game_id: gameId, author_id: currentUser.id, content: txt.slice(0, 2000) });
    setBusy(false);
    if (error) { setErr(error.message); return; }
    setDraft(""); setAdding(false);
    await load();
  };

  const saveEdit = async () => {
    const txt = editText.trim();
    if (!txt) return;
    setBusy(true); setErr("");
    const { error } = await supabase.from("game_rules")
      .update({ content: txt.slice(0, 2000), updated_at: new Date().toISOString() }).eq("id", editId);
    setBusy(false);
    if (error) { setErr(error.message); return; }
    setEditId(null); setEditText("");
    await load();
  };

  const removeRule = async (r) => {
    const ok = await askConfirm({
      title: "Supprimer ce point de règle ?",
      message: "Il disparaîtra de la fiche du jeu et du chronomètre, pour tous les membres.",
      confirmLabel: "Supprimer",
    });
    if (!ok) return;
    setErr("");
    const { error } = await supabase.from("game_rules").delete().eq("id", r.id);
    if (error) { setErr(error.message); return; }
    await load();
  };

  return (
    <Modal open onClose={onClose} title={`📖 Points de règle · ${gameName}`} width={580}>
      <p style={{ margin: "0 0 16px", fontSize: 13.5, color: "#8a7c6a", lineHeight: 1.55 }}>
        La mémoire commune de la table : les précisions de règle, variantes et pièges tranchés une bonne fois pour toutes.
        {currentUser ? " Chacun peut en ajouter, et corriger ou supprimer les siens." : ""}
      </p>

      {err && <div style={{ background: "rgba(181,40,58,.1)", color: C.red, padding: "10px 14px", borderRadius: 11, fontSize: 13, fontWeight: 600, marginBottom: 14 }}>{err}</div>}

      {rows === null ? (
        <div style={{ color: "#a89a86", fontSize: 14, padding: "12px 0", display: "flex", alignItems: "center", gap: 8 }}>
          <Loader2 size={16} className="aladj-spin" /> Chargement…
        </div>
      ) : rows.length === 0 ? (
        <div style={{ textAlign: "center", padding: "26px 16px", color: "#a89a86" }}>
          <BookOpen size={34} style={{ opacity: .4, marginBottom: 10 }} />
          <p style={{ fontSize: 14, margin: 0 }}>Aucun point de règle pour ce jeu.{currentUser ? " Soyez le premier à en noter un !" : ""}</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr)", gap: 10, marginBottom: 16 }}>
          {rows.map((r, i) => {
            const edited = r.updated_at && r.created_at && new Date(r.updated_at).getTime() - new Date(r.created_at).getTime() > 2000;
            const mine = !!currentUser && r.author_id === currentUser.id;
            return (
              <div key={r.id} style={{ display: "flex", gap: 11, background: "rgba(30,138,138,.06)", border: "1px solid rgba(30,138,138,.18)", borderRadius: 13, padding: "11px 14px" }}>
                <span style={{ flexShrink: 0, width: 26, height: 26, borderRadius: 8, background: C.teal, color: "#fff", display: "grid", placeItems: "center", fontFamily: "'Fredoka',sans-serif", fontWeight: 700, fontSize: 13 }}>{i + 1}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  {editId === r.id ? (
                    <div>
                      <textarea value={editText} onChange={(ev) => setEditText(ev.target.value)} rows={3} maxLength={2000}
                        style={{ ...inputStyle, resize: "vertical", marginBottom: 8 }} />
                      <div style={{ display: "flex", gap: 8 }}>
                        <Btn size="sm" variant="teal" onClick={saveEdit} disabled={busy || !editText.trim()}><Check size={14} /> Enregistrer</Btn>
                        <Btn size="sm" variant="soft" onClick={() => { setEditId(null); setEditText(""); }}>Annuler</Btn>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div style={{ fontSize: 14.5, color: "#4e463b", lineHeight: 1.55, whiteSpace: "pre-line", overflowWrap: "anywhere" }}>{r.content}</div>
                      <div style={{ fontSize: 11.5, color: "#9c8d79", marginTop: 5, display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap" }}>
                        <span>par {mine ? "vous" : nameOf(r.author_id)}</span>
                        <DeciderCrownFor id={r.author_id} size={11} />
                        <span>· {new Date(r.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</span>
                        {edited && <span style={{ fontStyle: "italic" }}>(modifié)</span>}
                      </div>
                    </>
                  )}
                </div>
                {canTouch(r) && editId !== r.id && (
                  <div style={{ display: "flex", gap: 9, flexShrink: 0 }}>
                    <button onClick={() => { setEditId(r.id); setEditText(r.content); }} title="Modifier ce point de règle"
                      style={{ background: "none", border: "none", cursor: "pointer", color: "#9c8d79", padding: 0, height: 20 }}><Edit3 size={15} /></button>
                    <button onClick={() => removeRule(r)} title="Supprimer ce point de règle"
                      style={{ background: "none", border: "none", cursor: "pointer", color: C.red, padding: 0, height: 20 }}><Trash2 size={15} /></button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {!currentUser ? (
        <span style={{ fontSize: 13, color: "#a89a86" }}>Connectez-vous pour ajouter un point de règle.</span>
      ) : !adding ? (
        <Btn full variant="soft" onClick={() => setAdding(true)}><Plus size={16} /> Ajouter un point de règle</Btn>
      ) : (
        <div style={{ background: "rgba(30,138,138,.06)", borderRadius: 12, padding: 12 }}>
          <Field label="Nouveau point de règle" hint="Soyez précis : la règle concernée, et ce qu'on a tranché.">
            <textarea value={draft} onChange={(ev) => setDraft(ev.target.value)} rows={3} maxLength={2000} autoFocus
              placeholder="Ex. : on ne peut défausser qu'une seule fois par tour, même avec la carte Marchand."
              style={{ ...inputStyle, resize: "vertical" }} />
          </Field>
          <div style={{ display: "flex", gap: 8 }}>
            <Btn size="sm" variant="teal" onClick={submitNew} disabled={busy || !draft.trim()}>
              {busy ? <Loader2 size={14} className="aladj-spin" /> : <><Check size={14} /> Ajouter</>}
            </Btn>
            <Btn size="sm" variant="soft" onClick={() => { setAdding(false); setDraft(""); }}>Annuler</Btn>
          </div>
        </div>
      )}
    </Modal>
  );
}

/* Fenetre « Statut » — ce que permet (ou non) chacun des 3 statuts. */
function StatusInfoModal({ onClose, role, isChild }) {
  const blocks = [
    {
      key: "membre", label: "Membre", color: C.teal, icon: Heart, price: "Gratuit",
      can: [
        "Consulter tout le site : ludothèque, fiches, moments jeux, trombinoscope.",
        "Ajouter ses jeux et ses extensions, tenir sa ludothèque, la partager ou la garder privée.",
        "Noter et commenter les jeux, dire ce qu'on a envie de découvrir.",
        "Créer des moments jeux, s'y inscrire, inviter d'autres membres.",
        "Enregistrer ses parties, lancer le chronomètre, gagner des badges.",
        "Emprunter et prêter des jeux entre membres.",
      ],
      cannot: [
        "<b>Pas d'onglet Décisionnaire</b> : il n'apparaît même pas dans le menu. Ni boîte à idées, ni votes en ligne — impossible de proposer une idée, de la soutenir, de la commenter, de lancer un vote, d'y voter ou d'en lire les résultats.",
        "Pas de voix délibérative en assemblée générale (présence possible à titre consultatif).",
        "Une caution (au prix neuf du jeu) peut être demandée par le prêteur lors d'une location.",
      ],
    },
    {
      key: "decideur", label: "Membre décisionnaire", color: C.amber, icon: Crown, price: COTISATION_EUR + " € / an (365 jours, cumulables)",
      can: [
        "Tout ce que fait un membre, sans exception.",
        "Voix délibérative en assemblée générale : c'est lui qui décide de l'avenir de l'asso.",
        "Accès à l'onglet <b>Décisionnaire</b>, invisible pour les autres membres : <b>boîte à idées</b> (proposer, soutenir, commenter) et <b>votes en ligne</b> (lancer un scrutin, voter, en discuter dans la zone de commentaires, lire les résultats).",
        "Prévenu par notification à chaque nouveau vote et à chaque commentaire déposé sous un vote.",
        "Pass Ludovore (Ludum.fr) offert pendant un an — valeur 29,99 €.",
        "Dispensé de caution lors d'une location de jeu.",
        "Une couronne ambre accompagne son nom partout sur le site.",
      ],
      cannot: [
        "Le statut dure 365 jours : passé ce délai, il faut le renouveler (le bandeau prévient 15 jours avant).",
      ],
    },
    {
      key: "enfant", label: "Compte enfant (moins de " + "{CHILD}" + " ans)", color: C.purple, icon: null, price: "Gratuit",
      can: [
        "Tout consulter, noter des jeux, tenir sa ludothèque, écrire des commentaires.",
        "Participer aux moments jeux <b>privés</b> auxquels il est convié.",
        "Enregistrer ses parties et gagner des badges comme tout le monde.",
      ],
      cannot: [
        "S'inscrire aux moments jeux de l'association <b>ouverts à tous</b>, en présentiel comme sur Board Game Arena.",
        "Le statut disparaît tout seul le jour des " + "{CHILD}" + " ans si la date de naissance complète est renseignée.",
      ],
    },
  ];
  const mineKey = isChild ? "enfant" : (role === "decideur" ? "decideur" : "membre");
  return (
    <Modal open onClose={onClose} title="Les statuts à l'ALADJ" width={620}>
      <p style={{ margin: "0 0 16px", fontSize: 13.5, color: "#8a7c6a", lineHeight: 1.55 }}>
        Trois statuts coexistent sur le site. Le vôtre est encadré en couleur.
        {" "}La différence la plus visible au quotidien tient à un onglet : <b>Décisionnaire</b> (idées et votes) n'apparaît
        dans le menu que pour les membres décisionnaires.
        {isChild ? " Un compte enfant peut aussi être décisionnaire une fois adulte." : ""}
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr)", gap: 14 }}>
        {blocks.map((b) => {
          const isMine = b.key === mineKey;
          const Icon = b.icon;
          return (
            <div key={b.key} style={{ background: isMine ? `${b.color}12` : "#fff", border: isMine ? `2px solid ${b.color}` : "1px solid #efe6d6", borderRadius: 16, padding: "14px 18px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 9, flexWrap: "wrap", marginBottom: 4 }}>
                <span style={{ width: 30, height: 30, borderRadius: 9, background: `${b.color}1f`, display: "grid", placeItems: "center", flexShrink: 0 }}>
                  {Icon ? <Icon size={16} color={b.color} /> : <PacifierIcon size={16} color={b.color} />}
                </span>
                <span style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 700, color: C.navy, fontSize: 16 }}>{b.label.replace(/\{CHILD\}/g, String(CHILD_AGE_LIMIT))}</span>
                {isMine && <span style={{ fontSize: 11, fontWeight: 700, color: "#fff", background: b.color, borderRadius: 999, padding: "2px 9px", fontFamily: "'Fredoka',sans-serif" }}>VOTRE STATUT</span>}
                <span style={{ marginLeft: "auto", fontSize: 12.5, color: b.color, fontWeight: 700, fontFamily: "'Fredoka',sans-serif" }}>{b.price}</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr)", gap: 5, marginTop: 10 }}>
                {b.can.map((t, i) => (
                  <div key={"c" + i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                    <Check size={14} color={C.teal} style={{ flexShrink: 0, marginTop: 3 }} />
                    <span style={{ fontSize: 13.5, color: "#5e5346", lineHeight: 1.5 }} dangerouslySetInnerHTML={{ __html: t.replace(/\{CHILD\}/g, String(CHILD_AGE_LIMIT)) }} />
                  </div>
                ))}
                {b.cannot.map((t, i) => (
                  <div key={"n" + i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                    <X size={14} color={C.red} style={{ flexShrink: 0, marginTop: 3 }} />
                    <span style={{ fontSize: 13.5, color: "#5e5346", lineHeight: 1.5 }} dangerouslySetInnerHTML={{ __html: t.replace(/\{CHILD\}/g, String(CHILD_AGE_LIMIT)) }} />
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </Modal>
  );
}

function RatingScaleNote() {
  const [open, setOpen] = useState(false);
  const scale = RATING_SCALE;
  return (
    <div style={{ background: "rgba(232,163,23,.08)", border: "1px solid rgba(232,163,23,.3)", borderRadius: 14, padding: "12px 16px", marginBottom: 20 }}>
      <button onClick={() => setOpen((o) => !o)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", background: "none", border: "none", cursor: "pointer", padding: 0, fontFamily: "'Fredoka',sans-serif", fontWeight: 700, color: C.navy, fontSize: 14.5 }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
          <Star size={16} fill={C.amber} color={C.amber} /> Comment on note les jeux à l'ALADJ
        </span>
        <ChevronRight size={16} style={{ transform: open ? "rotate(90deg)" : "rotate(0)", transition: "transform .15s", color: "#9c8d79" }} />
      </button>
      {open && (
        <>
          <p style={{ fontSize: 13.5, color: "#5e5346", margin: "10px 0 12px", lineHeight: 1.55 }}>
            {RATING_SCALE_INTRO}
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr)", gap: 6 }}>
            {scale.map((s) => (
              <div key={s.v} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ flexShrink: 0, width: 110 }}><Stars value={s.v} readOnly size={14} /></span>
                <span style={{ fontSize: 13.5, color: "#5e5346" }}>{s.t}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function Stars({ value = 0, onRate, onClear, size = 18, readOnly = false }) {
  const [hover, setHover] = useState(0); // valeur survolée (peut être .5)
  const shown = hover || value; // valeur affichée
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
      <span style={{ display: "inline-flex", gap: 2, position: "relative" }} onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((n) => {
          const full = shown >= n;
          const half = !full && shown >= n - 0.5;
          return (
            <span key={n} style={{ position: "relative", lineHeight: 0, display: "inline-block", width: size, height: size }}>
              {/* étoile de fond (vide) */}
              <Star size={size} fill="none" color="#cdb9a0" strokeWidth={1.8} style={{ position: "absolute", top: 0, left: 0 }} />
              {/* remplissage (plein ou moitié gauche) */}
              {(full || half) && (
                <span style={{ position: "absolute", top: 0, left: 0, width: half ? size / 2 : size, height: size, overflow: "hidden", lineHeight: 0 }}>
                  <Star size={size} fill={C.amber} color={C.amber} strokeWidth={1.8} />
                </span>
              )}
              {/* zones cliquables (au-dessus de tout) : moitié gauche = n-0.5, moitié droite = n */}
              {!readOnly && (
                <>
                  <button type="button" aria-label={`${n - 0.5} étoile`} title={`${String(n - 0.5).replace(".", ",")} / 5`}
                    onMouseEnter={() => setHover(n - 0.5)} onClick={(e) => { e.preventDefault(); e.stopPropagation(); onRate && onRate(n - 0.5); }}
                    style={{ position: "absolute", top: 0, left: 0, width: size / 2, height: size, background: "transparent", border: "none", padding: 0, margin: 0, cursor: "pointer", zIndex: 2 }} />
                  <button type="button" aria-label={`${n} étoiles`} title={`${n} / 5`}
                    onMouseEnter={() => setHover(n)} onClick={(e) => { e.preventDefault(); e.stopPropagation(); onRate && onRate(n); }}
                    style={{ position: "absolute", top: 0, left: size / 2, width: size / 2, height: size, background: "transparent", border: "none", padding: 0, margin: 0, cursor: "pointer", zIndex: 2 }} />
                </>
              )}
            </span>
          );
        })}
      </span>
      {/* bouton effacer la note */}
      {!readOnly && onClear && value > 0 && (
        <button type="button" onClick={onClear} title="Effacer ma note"
          style={{ display: "inline-flex", alignItems: "center", gap: 3, background: "rgba(181,40,58,.08)", color: C.red, border: "none", borderRadius: 8, padding: "4px 9px", cursor: "pointer", fontSize: 12, fontFamily: "'Fredoka',sans-serif", fontWeight: 600 }}>
          <X size={12} /> Effacer
        </button>
      )}
    </span>
  );
}

/* ---- Bouton ---- */
function Btn({ children, onClick, variant = "primary", size = "md", disabled, style, type = "button", full }) {
  const sizes = { sm: { padding: "7px 14px", fontSize: 13 }, md: { padding: "11px 20px", fontSize: 14.5 }, lg: { padding: "14px 26px", fontSize: 16 } };
  const variants = {
    primary: { background: C.navy, color: "#fff", border: `2px solid ${C.navy}` },
    teal: { background: C.teal, color: "#fff", border: `2px solid ${C.teal}` },
    amber: { background: C.amber, color: C.navyDeep, border: `2px solid ${C.amber}` },
    red: { background: C.red, color: "#fff", border: `2px solid ${C.red}` },
    ghost: { background: "transparent", color: C.navy, border: `2px solid ${C.navy}` },
    soft: { background: "rgba(26,58,92,.07)", color: C.navy, border: "2px solid transparent" },
    purple: { background: C.purple, color: "#fff", border: `2px solid ${C.purple}` },
    danger: { background: "transparent", color: C.red, border: `2px solid ${C.red}` },
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      style={{
        ...sizes[size], ...variants[variant], width: full ? "100%" : "auto",
        borderRadius: 12, fontWeight: 700, fontFamily: "'Fredoka', sans-serif", cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1, transition: "transform .12s, box-shadow .2s, filter .2s",
        display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, ...style,
      }}
      onMouseDown={(e) => !disabled && (e.currentTarget.style.transform = "scale(.97)")}
      onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
      onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}>
      {children}
    </button>
  );
}

/* ---- Champ texte ---- */
function Field({ label, children, hint }) {
  return (
    <label style={{ display: "block", marginBottom: 14 }}>
      <span style={{ display: "block", fontSize: 13, fontWeight: 700, color: C.navy, marginBottom: 6, fontFamily: "'Fredoka', sans-serif" }}>{label}</span>
      {children}
      {hint && <span style={{ display: "block", fontSize: 12, color: "#8a7c6a", marginTop: 4 }}>{hint}</span>}
    </label>
  );
}
const inputStyle = {
  width: "100%", padding: "11px 14px", borderRadius: 11, border: "2px solid #e6dcc9",
  background: "#fff", fontSize: 15, fontFamily: "'Nunito', sans-serif", color: C.ink, outline: "none",
  boxSizing: "border-box", transition: "border-color .15s",
};
function TextInput(props) {
  return <input {...props} style={{ ...inputStyle, ...props.style }}
    onFocus={(e) => (e.target.style.borderColor = C.teal)}
    onBlur={(e) => (e.target.style.borderColor = "#e6dcc9")} />;
}

/* ---- Champ image : URL OU import d'un fichier local (jpg, png...) avec compression auto ---- */
function ImageField({ value, onChange }) {
  const [err, setErr] = useState("");
  const [working, setWorking] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const fileRef = React.useRef(null);

  // Redimensionne (max 800px de côté) et recompresse en JPEG pour alléger l'image.
  const compressImage = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const MAX = 800;
        let { width, height } = img;
        if (width > MAX || height > MAX) {
          if (width >= height) { height = Math.round(height * MAX / width); width = MAX; }
          else { width = Math.round(width * MAX / height); height = MAX; }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, width, height); // fond blanc pour les PNG transparents
        ctx.drawImage(img, 0, 0, width, height);
        // qualité 0.8 ; on réduit si l'image reste trop lourde
        let quality = 0.8;
        let dataUrl = canvas.toDataURL("image/jpeg", quality);
        while (dataUrl.length > 250 * 1024 && quality > 0.4) { // vise < ~250 Ko
          quality -= 0.1;
          dataUrl = canvas.toDataURL("image/jpeg", quality);
        }
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error("Image illisible"));
      img.src = ev.target.result;
    };
    reader.onerror = () => reject(new Error("Lecture impossible"));
    reader.readAsDataURL(file);
  });

  const handleFile = async (e) => {
    setErr("");
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { setErr("Choisissez un fichier image (jpg, png...)."); return; }
    setWorking(true);
    try {
      const compressed = await compressImage(file); // remplace automatiquement l'ancienne valeur
      onChange(compressed);
    } catch (e) {
      setErr("Impossible de traiter cette image. Essayez une autre, ou utilisez une adresse web.");
    }
    setWorking(false);
    if (fileRef.current) fileRef.current.value = ""; // permet de réimporter le même fichier
  };

  // Télécharge une image depuis une URL, la convertit et la stocke localement.
  // Indispensable pour BGG, qui bloque l'affichage direct de ses images (hotlinking).
  const importFromUrl = async (rawUrl) => {
    const url = rawUrl.trim();
    if (!url || !/^https?:\/\//i.test(url)) { setErr("Adresse invalide."); return; }
    setErr(""); setWorking(true);
    // on tente plusieurs voies pour récupérer l'image malgré les blocages
    const tries = [
      url,
      `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
      `https://api.codetabs.com/v1/proxy/?quest=${encodeURIComponent(url)}`,
    ];
    for (const u of tries) {
      try {
        const res = await fetch(u);
        if (!res.ok) continue;
        const blob = await res.blob();
        if (!blob.type.startsWith("image/")) continue;
        const file = new File([blob], "image", { type: blob.type });
        const compressed = await compressImage(file);
        onChange(compressed);
        setWorking(false);
        return;
      } catch (e) { /* voie suivante */ }
    }
    setWorking(false);
    setErr("Impossible de récupérer cette image. Téléchargez-la sur votre appareil puis utilisez « Importer ».");
  };

  const isLocal = value && value.startsWith("data:");

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
        <TextInput value={urlInput} onChange={(e) => setUrlInput(e.target.value)} placeholder="Coller l'adresse d'une image (https://...)" style={{ flex: 1 }} disabled={working}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); importFromUrl(urlInput); } }} />
        <Btn variant="soft" size="md" onClick={() => importFromUrl(urlInput)} type="button" disabled={working || !urlInput.trim()}>Charger</Btn>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <span style={{ flex: 1, height: 1, background: "#ece2d0" }} />
        <span style={{ fontSize: 12, color: "#a89a86" }}>ou</span>
        <span style={{ flex: 1, height: 1, background: "#ece2d0" }} />
      </div>
      <Btn variant="soft" size="md" onClick={() => fileRef.current?.click()} type="button" disabled={working} full>
        {working ? <Loader2 size={15} className="aladj-spin" /> : <><Download size={15} style={{ transform: "rotate(180deg)" }} /> Importer depuis mon appareil</>}
      </Btn>
      <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{ display: "none" }} />

      {value && !working && (
        <div style={{ display: "flex", alignItems: "center", gap: 12, background: "rgba(0,0,0,.03)", borderRadius: 10, padding: 8, marginTop: 8 }}>
          <img src={value} alt="aperçu" style={{ width: 54, height: 54, objectFit: "cover", borderRadius: 8 }} />
          <span style={{ fontSize: 12.5, color: "#8a7c6a", flex: 1 }}>Image enregistrée et optimisée ✓</span>
          <button type="button" onClick={() => { onChange(""); setUrlInput(""); }} style={{ background: "none", border: "none", cursor: "pointer", color: C.red, padding: 6 }}><X size={16} /></button>
        </div>
      )}
      {working && <div style={{ fontSize: 12.5, color: C.teal, marginTop: 8 }}>Traitement de l'image en cours...</div>}
      {err && <div style={{ color: C.red, fontSize: 12.5, marginTop: 6 }}>{err}</div>}
    </div>
  );
}

/* ---- Modale ---- */
function Modal({ open, onClose, children, title, width = 560 }) {
  // On ne ferme sur clic de l'arrière-plan QUE si le geste de souris a commencé
  // ET s'est terminé sur l'arrière-plan lui-même. Cela évite les fermetures
  // intempestives quand on sélectionne du texte dans un champ et que le geste
  // déborde hors de la fenêtre (cas classique du "mousedown dedans, mouseup dehors").
  const downOnOverlay = useRef(false);
  const overlayRef = useRef(null);

  useScrollLock(open);

  useEffect(() => {
    if (!open) return;
    const h = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);

  // À l'ouverture, on rend la fenêtre visible : on remonte en haut l'overlay courant
  // ET les overlays parents qui seraient défilés. Sans ça, une fenêtre ouverte depuis
  // une fiche déjà scrollée apparaît hors écran sur mobile (le flou des overlays parents
  // crée un « containing block » qui décale les fenêtres imbriquées).
  useEffect(() => {
    if (!open) return;
    const el = overlayRef.current;
    if (el) el.scrollTop = 0;
    let p = el ? el.parentElement : null;
    while (p && p !== document.body) {
      if (p.scrollHeight > p.clientHeight + 1) p.scrollTop = 0;
      p = p.parentElement;
    }
  }, [open]);

  if (!open) return null;
  return (
    <div
      ref={overlayRef}
      onMouseDown={(e) => { downOnOverlay.current = e.target === e.currentTarget; }}
      onMouseUp={(e) => { if (downOnOverlay.current && e.target === e.currentTarget) onClose(); downOnOverlay.current = false; }}
      onClick={(e) => e.stopPropagation()}
      style={{
        position: "fixed", inset: 0, background: "rgba(18,41,63,.55)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "5vh 16px", zIndex: 1000,
        overflowY: "auto", overscrollBehavior: "contain", WebkitOverflowScrolling: "touch",
      }}>
      <div style={{
        background: C.paper, borderRadius: 22, width: "100%", maxWidth: width, boxShadow: "0 30px 80px rgba(18,41,63,.35)",
        border: "1px solid #ece2d0", animation: "popIn .25s ease", overflow: "hidden",
      }}>
        <div className="aladj-modal-head" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "18px 24px", borderBottom: "1px solid #efe6d6" }}>
          <h3 style={{ margin: 0, minWidth: 0, overflowWrap: "anywhere", fontFamily: "'Fredoka', sans-serif", color: C.navy, fontSize: 20 }}>{title}</h3>
          <button onClick={onClose} style={{ background: "rgba(26,58,92,.07)", border: "none", borderRadius: 10, width: 34, height: 34, flexShrink: 0, cursor: "pointer", display: "grid", placeItems: "center", color: C.navy }}>
            <X size={18} />
          </button>
        </div>
        <div className="aladj-modal-body" style={{ padding: 24 }}>{children}</div>
      </div>
    </div>
  );
}

/* -----------------------------------------------------------------------------
   VERROU DE DEFILEMENT
   Tant qu'une fenetre est ouverte, la page derriere ne doit pas bouger.
   Compteur global : les fenetres s'empilent (une fiche de jeu ouvre une
   confirmation, qui ouvre un pave de score...) et le verrou ne doit sauter
   qu'a la fermeture de la derniere.
   On fige le <body> en position: fixed en memorisant le defilement, plutot que
   par overflow: hidden -- seule methode qui tienne sur Safari iOS.
   --------------------------------------------------------------------------- */
let __aladjScrollLocks = 0;
let __aladjScrollY = 0;

function useScrollLock(active) {
  useEffect(() => {
    if (!active || typeof document === "undefined") return undefined;
    const b = document.body;
    if (__aladjScrollLocks === 0) {
      __aladjScrollY = window.scrollY || window.pageYOffset || 0;
      b.style.position = "fixed";
      b.style.top = `-${__aladjScrollY}px`;
      b.style.left = "0";
      b.style.right = "0";
      b.style.width = "100%";
      b.style.overflow = "hidden";
    }
    __aladjScrollLocks += 1;
    return () => {
      __aladjScrollLocks = Math.max(0, __aladjScrollLocks - 1);
      if (__aladjScrollLocks === 0) {
        b.style.position = "";
        b.style.top = "";
        b.style.left = "";
        b.style.right = "";
        b.style.width = "";
        b.style.overflow = "";
        window.scrollTo(0, __aladjScrollY);
      }
    };
  }, [active]);
}

/* ---- Badge ---- */
function Badge({ children, color = C.teal, soft = true }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 700, padding: "4px 10px",
      borderRadius: 999, fontFamily: "'Fredoka', sans-serif",
      background: soft ? `${color}1a` : color, color: soft ? color : "#fff", whiteSpace: "nowrap",
    }}>{children}</span>
  );
}

function Toast({ msg, onDone }) {
  useEffect(() => { if (msg) { const t = setTimeout(onDone, 3200); return () => clearTimeout(t); } }, [msg, onDone]);
  if (!msg) return null;
  return (
    <div style={{
      position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", zIndex: 2000,
      background: C.navy, color: "#fff", padding: "13px 22px", borderRadius: 14, fontFamily: "'Fredoka', sans-serif",
      fontWeight: 600, boxShadow: "0 14px 40px rgba(18,41,63,.4)", display: "flex", alignItems: "center", gap: 10, animation: "popIn .25s ease",
    }}>
      <Check size={18} color={C.amber} /> {msg}
    </div>
  );
}

/* =============================================================================
   NAVIGATION
   ============================================================================= */
const NAV = [
  { key: "accueil", label: "Accueil", icon: Home },
  { key: "soirees", label: "Moments jeux", icon: Calendar },
  { key: "ludotheque", label: "Ludothèque", icon: Library },
  { key: "ma-ludo", label: "Mon espace", icon: BookOpen, auth: true },
  { key: "a-venir", label: "À venir", icon: Sparkles },
  { key: "locations", label: "Mes locations", icon: ArrowRightLeft, auth: true },
  // Onglet reserve : il n'apparait que pour les membres decisionnaires (et les
  // administrateurs). Le serveur applique la meme regle, l'onglet cache n'est
  // qu'un confort d'affichage.
  { key: "decideur", label: "Décisionnaire", icon: Crown, auth: true, decider: true },
  { key: "guide", label: "Guide", icon: HelpCircle },
];

// Un membre decisionnaire (ou un administrateur) a acces a l'espace decisionnaire.
function isDecideur(u) {
  return !!u && (u.role === "decideur" || u.admin === true);
}

function Navbar({ page, setPage, onAuth }) {
  const { currentUser, logout, notifications, momentsUnseen, eventPlaySuggestions, myPendingPlays, reload, personalReady } = useApp();
  const [refreshing, setRefreshing] = useState(false);
  const doRefresh = async () => { setRefreshing(true); try { await reload(); } finally { setRefreshing(false); } };
  const [open, setOpen] = useState(false);
  const [editProfile, setEditProfile] = useState(false);
  const items = NAV.filter((n) => (!n.auth || currentUser) && (!n.decider || isDecideur(currentUser)));
  const unreadNotifs = personalReady ? (notifications || []).filter((n) => !n.read).length : 0;
  const ludoBadge = personalReady ? unreadNotifs + (eventPlaySuggestions || []).length + (myPendingPlays || []).length : 0;

  return (
    <>
    <header style={{
      position: "sticky", top: 0, zIndex: 500, background: "rgba(251,247,239,.86)", backdropFilter: "blur(12px)",
      borderBottom: "1px solid #ece2d0",
    }}>
      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "12px 20px", display: "flex", alignItems: "center", gap: 16 }}>
        <button onClick={() => setPage("accueil")} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", padding: 0 }} title="Accueil">
          <img src={LOGO_URL} alt="ALADJ — À l'assaut des jeux" style={{ height: 48, width: "auto", display: "block" }} />
        </button>

        <nav style={{ display: "flex", gap: 4, marginLeft: 12 }} className="aladj-desktop-nav">
          {items.map((n) => {
            const Icon = n.icon; const active = page === n.key;
            const badgeCount = n.key === "ma-ludo" ? ludoBadge : (n.key === "soirees" ? momentsUnseen : 0);
            return (
              <button key={n.key} onClick={() => setPage(n.key)} style={{
                position: "relative",
                display: "flex", alignItems: "center", gap: 7, padding: "9px 14px", borderRadius: 11, border: "none",
                cursor: "pointer", fontFamily: "'Fredoka', sans-serif", fontWeight: 600, fontSize: 14.5,
                background: active ? C.navy : "transparent", color: active ? "#fff" : C.navy, transition: "background .15s",
              }}>
                <Icon size={17} /> {n.label}
                {badgeCount > 0 && <span style={{ position: "absolute", top: 3, right: 5, minWidth: 16, height: 16, padding: "0 4px", borderRadius: 999, background: C.red, color: "#fff", fontSize: 10.5, fontWeight: 700, display: "grid", placeItems: "center" }}>{badgeCount}</span>}
              </button>
            );
          })}
        </nav>

        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }} className="aladj-desktop-nav">
          {currentUser ? (
            <>
              <button onClick={() => setEditProfile(true)} title="Modifier mon profil" style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 12px", borderRadius: 11, background: "rgba(30,138,138,.1)", border: "none", cursor: "pointer" }}>
                <span style={{ width: 28, height: 28, borderRadius: 8, overflow: "hidden", background: C.teal, color: "#fff", display: "grid", placeItems: "center", fontFamily: "'Fredoka',sans-serif", fontWeight: 700, fontSize: 14 }}>
                  {currentUser.avatar ? <img src={currentUser.avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : currentUser.name[0].toUpperCase()}
                </span>
                <span style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 600, color: C.navy, fontSize: 14 }}>{currentUser.name}</span>
                {currentUser.role === "decideur" && <Crown size={15} color={C.amber} />}
              </button>
              <Btn variant="ghost" size="sm" onClick={logout}><LogOut size={15} /> Sortir</Btn>
            </>
          ) : (
            <>
              <Btn variant="ghost" size="sm" onClick={() => onAuth("login")}><LogIn size={15} /> Connexion</Btn>
              <Btn variant="amber" size="sm" onClick={() => onAuth("register")}><UserPlus size={15} /> Adhérer</Btn>
            </>
          )}
        </div>

        <button className="aladj-burger" onClick={doRefresh} disabled={refreshing} aria-label="Rafraichir" title="Rafraichir" style={{
          marginLeft: "auto", display: "none", background: "#fff", color: C.navy, border: `1.5px solid ${C.navy}22`, borderRadius: 10, width: 40, height: 40, cursor: refreshing ? "default" : "pointer", placeItems: "center",
        }}>
          <RefreshCw size={19} className={refreshing ? "aladj-spin" : undefined} />
        </button>
        <button className="aladj-burger" onClick={() => setOpen(!open)} style={{
          marginLeft: 8, display: "none", position: "relative", background: C.navy, color: "#fff", border: "none", borderRadius: 10, width: 40, height: 40, cursor: "pointer", placeItems: "center",
        }}>
          {open ? <X size={20} /> : <Menu size={20} />}
          {!open && (ludoBadge + momentsUnseen) > 0 && <span style={{ position: "absolute", top: -5, right: -5, minWidth: 18, height: 18, padding: "0 5px", borderRadius: 999, background: C.red, color: "#fff", fontSize: 11, fontWeight: 700, display: "grid", placeItems: "center", border: "2px solid #FBF7EF" }}>{ludoBadge + momentsUnseen}</span>}
        </button>
      </div>

      {open && (
        <div className="aladj-mobile-menu" style={{ padding: "8px 16px 18px", display: "grid", gridTemplateColumns: "minmax(0,1fr)", gap: 6, borderTop: "1px solid #ece2d0" }}>
          {items.map((n) => {
            const Icon = n.icon; const active = page === n.key;
            const badgeCount = n.key === "ma-ludo" ? ludoBadge : (n.key === "soirees" ? momentsUnseen : 0);
            return (
              <button key={n.key} onClick={() => { setPage(n.key); setOpen(false); }} style={{
                display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", borderRadius: 12, border: "none", cursor: "pointer",
                fontFamily: "'Fredoka',sans-serif", fontWeight: 600, fontSize: 16, background: active ? C.navy : "rgba(26,58,92,.06)", color: active ? "#fff" : C.navy,
              }}><Icon size={19} /> {n.label}
                {badgeCount > 0 && <span style={{ marginLeft: "auto", minWidth: 20, height: 20, padding: "0 6px", borderRadius: 999, background: C.red, color: "#fff", fontSize: 12, fontWeight: 700, display: "grid", placeItems: "center" }}>{badgeCount}</span>}
              </button>
            );
          })}
          <div style={{ height: 1, background: "#ece2d0", margin: "6px 0" }} />
          {currentUser ? (
            <>
              <div style={{ padding: "8px 4px", fontFamily: "'Fredoka',sans-serif", color: C.navy, fontWeight: 600 }}>Connecté : {currentUser.name}</div>
              <Btn variant="ghost" onClick={() => { setEditProfile(true); setOpen(false); }} full><Users size={16} /> Mon profil</Btn>
              <Btn variant="ghost" onClick={() => { logout(); setOpen(false); }} full><LogOut size={16} /> Se déconnecter</Btn>
            </>
          ) : (
            <>
              <Btn variant="ghost" onClick={() => { onAuth("login"); setOpen(false); }} full><LogIn size={16} /> Connexion</Btn>
              <Btn variant="amber" onClick={() => { onAuth("register"); setOpen(false); }} full><UserPlus size={16} /> Adhérer</Btn>
            </>
          )}
        </div>
      )}
    </header>
    {editProfile && <ProfileEditModal onClose={() => setEditProfile(false)} />}
    </>
  );
}

/* ---- Modale : édition de son propre profil ---- */
// member : membre a modifier. Absent = mon propre profil.
// Un administrateur peut ouvrir n'importe quel profil depuis le trombinoscope
// ou depuis la fiche du membre.
function ProfileEditModal({ onClose, member }) {
  const { currentUser, updateProfile } = useApp();
  const target = member || currentUser;
  const asAdmin = !!member && member.id !== currentUser?.id;
  const [f, setF] = useState({
    name: target?.name || "", avatar: target?.avatar || "", city: target?.city || "",
    bio: target?.bio || "", bggUrl: target?.bggUrl || "", okkazeoUrl: target?.okkazeoUrl || "",
    favMechanics: target?.favMechanics || [],
    hatedMechanics: target?.hatedMechanics || [],
    favColors: target?.favColors || [],
    birthDay: target?.birthDay || "",
    birthMonth: target?.birthMonth || "",
    birthYear: target?.birthYear || "",
    isChild: target?.isChild === true,
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  // Cette fenêtre peut être ouverte PAR-DESSUS une autre (trombinoscope, fiche
  // membre). Sans interception en phase de capture, Échap fermerait aussi les
  // fenêtres parentes et ferait perdre la saisie en cours.
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") { e.stopPropagation(); closeRef.current(); } };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, []);

  const toggleMech = (m) => setF((s) => {
    if (s.favMechanics.includes(m)) return { ...s, favMechanics: s.favMechanics.filter((x) => x !== m) };
    if (s.favMechanics.length >= 6) return s; // max 6
    // Une mécanique ne peut pas être à la fois préférée et détestée : on la retire des détestées si besoin.
    return { ...s, favMechanics: [...s.favMechanics, m], hatedMechanics: (s.hatedMechanics || []).filter((x) => x !== m) };
  });
  // Mécaniques détestées : aucune limite de nombre. Exclusivité avec les préférées.
  const toggleHatedMech = (m) => setF((s) => {
    const cur = s.hatedMechanics || [];
    if (cur.includes(m)) return { ...s, hatedMechanics: cur.filter((x) => x !== m) };
    return { ...s, hatedMechanics: [...cur, m], favMechanics: s.favMechanics.filter((x) => x !== m) };
  });
  // Couleurs préférées : clic = ajoute en fin (top suivant) ; re-clic = retire (les suivantes remontent). Max 3.
  const toggleColor = (k) => setF((s) => {
    const cur = s.favColors || [];
    if (cur.includes(k)) return { ...s, favColors: cur.filter((x) => x !== k) };
    if (cur.length >= 3) return s;
    return { ...s, favColors: [...cur, k] };
  });

  const save = async () => {
    setErr("");
    if (!f.name.trim()) { setErr("Le nom ne peut pas être vide."); return; }
    if ((f.birthDay && !f.birthMonth) || (!f.birthDay && f.birthMonth)) { setErr("Pour l'anniversaire, indiquez le jour ET le mois (ou aucun des deux)."); return; }
    setBusy(true);
    const res = await updateProfile(f, asAdmin ? member.id : undefined);
    setBusy(false);
    if (res?.error) { setErr(res.error); return; }
    onClose();
  };

  return (
    <Modal open onClose={onClose} title={asAdmin ? `Profil de ${member.name}` : "Mon profil"} width={560}>
      {asAdmin && (
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10, background: "rgba(107,58,122,.1)", border: `1.5px solid ${C.purple}44`, borderRadius: 13, padding: "11px 14px", marginBottom: 16, fontSize: 13.5, lineHeight: 1.5, color: C.navy }}>
          <ShieldCheck size={18} color={C.purple} style={{ flexShrink: 0, marginTop: 1 }} />
          <span><b>Vue administrateur.</b> Vous modifiez le profil de <b>{member.name}</b>, pas le vôtre. Le membre n'est pas prévenu de la modification — prévenez-le de vive voix ou sur Signal si le changement le concerne directement.</span>
        </div>
      )}
      {/* avatar */}
      <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 18 }}>
        <div style={{ width: 72, height: 72, borderRadius: 18, flexShrink: 0, overflow: "hidden", background: C.teal, display: "grid", placeItems: "center" }}>
          {f.avatar ? <img src={f.avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 700, color: "#fff", fontSize: 30 }}>{(f.name[0] || "?").toUpperCase()}</span>}
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ display: "block", fontFamily: "'Fredoka',sans-serif", fontWeight: 600, color: C.navy, fontSize: 14, marginBottom: 6 }}>Photo / image de profil</label>
          <ImageField value={f.avatar} onChange={(v) => setF({ ...f, avatar: v })} />
        </div>
      </div>

      <Field label="Nom affiché"><TextInput value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
      <Field label="Ville"><TextInput value={f.city} onChange={(e) => setF({ ...f, city: e.target.value })} placeholder="Ex. Gouville-sur-Mer" /></Field>
      <Field label="Anniversaire" hint="Jour et mois suffisent — l'année est facultative. Votre anniversaire apparaîtra 🎂 dans le calendrier des moments jeux.">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr 1fr", gap: 8 }}>
          <select value={f.birthDay} onChange={(e) => setF({ ...f, birthDay: e.target.value })} style={{ padding: "10px 11px", borderRadius: 10, border: "1.5px solid #e6dcc9", fontFamily: "'Nunito',sans-serif", fontSize: 14, background: "#fff", color: C.navy }}>
            <option value="">Jour —</option>
            {Array.from({ length: 31 }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1}</option>)}
          </select>
          <select value={f.birthMonth} onChange={(e) => setF({ ...f, birthMonth: e.target.value })} style={{ padding: "10px 11px", borderRadius: 10, border: "1.5px solid #e6dcc9", fontFamily: "'Nunito',sans-serif", fontSize: 14, background: "#fff", color: C.navy }}>
            <option value="">Mois —</option>
            {["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"].map((mo, i) => <option key={i + 1} value={i + 1}>{mo}</option>)}
          </select>
          <TextInput type="number" value={f.birthYear} onChange={(e) => setF({ ...f, birthYear: e.target.value })} placeholder="Année (facult.)" />
        </div>
      </Field>

      {/* compte enfant */}
      <label style={{ display: "flex", alignItems: "flex-start", gap: 11, padding: "12px 14px", borderRadius: 12, background: f.isChild ? "rgba(107,58,122,.1)" : "rgba(26,58,92,.05)", border: `1.5px solid ${f.isChild ? C.purple : "transparent"}`, marginBottom: 16, cursor: "pointer" }}>
        <input type="checkbox" checked={f.isChild} onChange={(e) => setF({ ...f, isChild: e.target.checked })} style={{ width: 19, height: 19, accentColor: C.purple, marginTop: 2, flexShrink: 0 }} />
        <span style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 600, color: C.navy, fontSize: 14 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><PacifierIcon size={15} /> Compte enfant (moins de {CHILD_AGE_LIMIT} ans)</span>
          <span style={{ display: "block", fontSize: 12.5, color: "#8a7c6a", fontWeight: 400, lineHeight: 1.55, marginTop: 4 }}>
            Une tétine apparaîtra à côté du nom, partout sur le site. Les enfants peuvent avoir un compte et participer aux <b>moments jeux privés</b>, mais pas aux moments jeux de l'association ouverts à tous (présentiel comme BGA) avant {CHILD_AGE_LIMIT} ans.
            {f.birthDay && f.birthMonth && f.birthYear
              ? " Votre date de naissance étant renseignée, la tétine disparaîtra automatiquement le jour de vos " + CHILD_AGE_LIMIT + " ans."
              : " Renseignez la date de naissance complète ci-dessus pour que la tétine disparaisse automatiquement le jour des " + CHILD_AGE_LIMIT + " ans."}
          </span>
        </span>
      </label>

      <Field label={`Présentation (${f.bio.length}/500)`} hint="Quelques mots sur vous, vos goûts de jeu...">
        <textarea value={f.bio} onChange={(e) => setF({ ...f, bio: e.target.value.slice(0, 500) })} rows={3} style={{ ...inputStyle, resize: "vertical" }} placeholder="Joueur passionné depuis..." />
      </Field>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Lien BoardGameGeek" hint="Facultatif"><TextInput value={f.bggUrl} onChange={(e) => setF({ ...f, bggUrl: e.target.value })} placeholder="https://boardgamegeek.com/user/..." /></Field>
        <Field label="Lien Okkazeo" hint="Facultatif"><TextInput value={f.okkazeoUrl} onChange={(e) => setF({ ...f, okkazeoUrl: e.target.value })} placeholder="https://www.okkazeo.com/..." /></Field>
      </div>

      <Field label={`Mécaniques préférées (${f.favMechanics.length}/6)`} hint="Choisissez jusqu'à 6 types de jeux que vous aimez">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
          {MECHANIC_SUGGESTIONS.map((m) => {
            const active = f.favMechanics.includes(m);
            const disabled = !active && f.favMechanics.length >= 6;
            return <button key={m} type="button" onClick={() => toggleMech(m)} disabled={disabled} style={{ padding: "6px 12px", borderRadius: 999, cursor: disabled ? "not-allowed" : "pointer", fontFamily: "'Fredoka',sans-serif", fontWeight: 600, fontSize: 12.5, border: `2px solid ${active ? C.purple : "#e6dcc9"}`, background: active ? C.purple : "#fff", color: active ? "#fff" : (disabled ? "#cdbfa8" : "#8a7c6a"), opacity: disabled ? .6 : 1 }}>{m}</button>;
          })}
        </div>
      </Field>

      <Field label={`Mécaniques détestées${(f.hatedMechanics || []).length ? ` (${f.hatedMechanics.length})` : ""}`} hint="Les types de jeux auxquels vous ne voulez ABSOLUMENT PAS jouer. Le composeur de tablée ne proposera jamais un jeu comportant l'une de ces mécaniques à une tablée dont vous faites partie. Aucune limite de nombre.">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
          {MECHANIC_SUGGESTIONS.map((m) => {
            const active = (f.hatedMechanics || []).includes(m);
            return <button key={m} type="button" onClick={() => toggleHatedMech(m)} style={{ padding: "6px 12px", borderRadius: 999, cursor: "pointer", fontFamily: "'Fredoka',sans-serif", fontWeight: 600, fontSize: 12.5, border: `2px solid ${active ? C.red : "#e6dcc9"}`, background: active ? C.red : "#fff", color: active ? "#fff" : "#8a7c6a" }}>{active ? "🚫 " : ""}{m}</button>;
          })}
        </div>
      </Field>

      <Field label="Couleurs de jeu préférées" hint="Cliquez dans l'ordre de préférence (jusqu'à 3). Utile pour distribuer les couleurs en soirée.">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 9 }}>
          {GAME_COLORS.map((col) => {
            const rank = (f.favColors || []).indexOf(col.key); // -1 si non choisi
            const active = rank >= 0;
            const full = !active && (f.favColors || []).length >= 3;
            return (
              <button key={col.key} type="button" onClick={() => toggleColor(col.key)} disabled={full} title={col.label}
                style={{ position: "relative", display: "flex", alignItems: "center", gap: 7, padding: "5px 11px 5px 6px", borderRadius: 999, cursor: full ? "not-allowed" : "pointer", background: "#fff", border: `2px solid ${active ? C.navy : "#e6dcc9"}`, opacity: full ? .45 : 1 }}>
                <span style={{ width: 22, height: 22, borderRadius: "50%", background: col.hex, border: "1px solid rgba(0,0,0,.15)", flexShrink: 0 }} />
                <span style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 600, fontSize: 12.5, color: C.navy }}>{col.label}</span>
                {active && <span style={{ minWidth: 18, height: 18, borderRadius: "50%", background: C.navy, color: "#fff", fontSize: 11, fontWeight: 700, display: "grid", placeItems: "center", padding: "0 2px" }}>{rank + 1}</span>}
              </button>
            );
          })}
        </div>
        {(f.favColors || []).length > 0 && (
          <div style={{ marginTop: 8, fontSize: 12.5, color: "#8a7c6a" }}>
            Votre podium : {(f.favColors || []).map((k, i) => `${i + 1}. ${colorByKey(k)?.label || k}`).join("   ")}
          </div>
        )}
      </Field>

      {err && <div style={{ background: "rgba(181,40,58,.1)", color: C.red, padding: "10px 14px", borderRadius: 11, fontSize: 13.5, fontWeight: 600, marginBottom: 14 }}>{err}</div>}
      <Btn full size="lg" onClick={save} disabled={busy}>{busy ? <Loader2 size={18} className="aladj-spin" /> : <><Check size={18} /> Enregistrer mon profil</>}</Btn>
    </Modal>
  );
}


/* =============================================================================
   AUTHENTIFICATION (modale) — Supabase
   ============================================================================= */
function AuthModal({ mode, onClose, setToast }) {
  const { login, register, loginWithGoogle, resetPassword } = useApp();
  const [tab, setTab] = useState(mode || "login");
  const [forgot, setForgot] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", pwd: "", pwd2: "", role: "membre" });
  const [showPwd, setShowPwd] = useState(false);
  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);
  const [welcome, setWelcome] = useState(null); // { name } → affiche l'écran de bienvenue + consigne de présentation
  // Écran d'engagement affiché AVANT toute création de compte : "email" ou "google"
  // selon la méthode d'inscription choisie.
  const [pledge, setPledge] = useState(null);
  const [pledgeOk, setPledgeOk] = useState(false);       // case d'engagement cochée
  const [pledgeWay, setPledgeWay] = useState("signal");  // "signal" | "mail"
  useEffect(() => setTab(mode), [mode]);

  // Connexion Google : directe si on se connecte, précédée de l'engagement si on s'inscrit.
  const runGoogle = async () => {
    setErr("");
    const res = await loginWithGoogle();
    if (res?.error) { setPledge(null); setErr(res.error); }
  };

  // Création effective du compte, une fois l'engagement validé.
  const doRegister = async () => {
    setErr(""); setBusy(true);
    const res = await register(form);
    setBusy(false);
    if (res.error) { setPledge(null); setErr(res.error); return; }
    setPledge(null);
    setWelcome({ name: res.user.name, needsConfirm: !!res.needsConfirm, way: pledgeWay });
  };

  const submit = async () => {
    setErr(""); setInfo("");
    if (tab === "register") {
      // On valide le formulaire, puis on passe par l'écran d'engagement (Signal / présentation)
      // avant de créer réellement le compte.
      if (!form.name.trim()) { setErr("Indiquez votre nom ou pseudo."); return; }
      if (!form.email.trim()) { setErr("Indiquez votre adresse e-mail."); return; }
      if (form.pwd.length < 6) { setErr("Le mot de passe doit faire au moins 6 caractères."); return; }
      if (form.pwd !== form.pwd2) { setErr("Les deux mots de passe ne correspondent pas."); return; }
      setPledgeOk(false); setPledgeWay("signal"); setPledge("email");
      return;
    }
    setBusy(true);
    const res = await login({ email: form.email, pwd: form.pwd });
    setBusy(false);
    if (res.error) { setErr(res.error); return; }
    onClose();
    setToast(`Bienvenue ${res.user.name} !`);
  };

  const sendReset = async () => {
    setErr(""); setBusy(true);
    const res = await resetPassword(form.email);
    setBusy(false);
    if (res.error) { setErr(res.error); return; }
    setForgotSent(true);
  };

  // Écran « mot de passe oublié » : envoi d'un lien de réinitialisation.
  if (forgot) {
    return (
      <Modal open onClose={onClose} title="Mot de passe oublié" width={460}>
        {forgotSent ? (
          <div style={{ textAlign: "center", padding: "6px 4px" }}>
            <div style={{ width: 60, height: 60, borderRadius: "50%", background: "rgba(30,138,138,.12)", display: "grid", placeItems: "center", margin: "0 auto 16px" }}><Mail size={28} color={C.teal} /></div>
            <p style={{ fontSize: 14.5, color: "#5e5346", lineHeight: 1.6, marginBottom: 20 }}>Si un compte existe pour <b>{form.email}</b>, un e-mail contenant un lien de réinitialisation vient d'être envoyé. Pense à vérifier tes spams.</p>
            <Btn full variant="teal" size="lg" onClick={() => { setForgot(false); setForgotSent(false); setErr(""); }}>Retour à la connexion</Btn>
          </div>
        ) : (
          <>
            <p style={{ fontSize: 14, color: "#6e6256", margin: "0 0 14px", lineHeight: 1.5 }}>Entre ton adresse e-mail : nous t'enverrons un lien pour choisir un nouveau mot de passe.</p>
            <Field label="Adresse e-mail">
              <TextInput type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="vous@exemple.fr" onKeyDown={(e) => e.key === "Enter" && sendReset()} />
            </Field>
            {err && <div style={{ background: "rgba(181,40,58,.1)", color: C.red, padding: "10px 14px", borderRadius: 11, fontSize: 13.5, fontWeight: 600, marginBottom: 14 }}>{err}</div>}
            <Btn onClick={sendReset} disabled={busy} full size="lg" variant="primary">{busy ? <Loader2 size={18} className="aladj-spin" /> : <><Mail size={17} /> Envoyer le lien</>}</Btn>
            <button type="button" onClick={() => { setForgot(false); setErr(""); }} style={{ background: "none", border: "none", color: "#9c8d79", cursor: "pointer", fontFamily: "'Nunito',sans-serif", fontWeight: 700, fontSize: 13.5, padding: 10, display: "block", margin: "8px auto 0" }}>Retour à la connexion</button>
          </>
        )}
      </Modal>
    );
  }

  // Écran d'engagement : dernière étape avant la création du compte.
  // Rappelle que l'association vit surtout sur Signal et fait choisir
  // la façon de se présenter (Signal ou e-mail).
  if (pledge) {
    return (
      <Modal open onClose={onClose} title="Avant de créer votre compte" width={540}>
        <div style={{ display: "flex", gap: 11, alignItems: "flex-start", background: "rgba(30,138,138,.1)", border: `1.5px solid ${C.teal}44`, borderRadius: 14, padding: "14px 16px", marginBottom: 16 }}>
          <MessageCircle size={22} color={C.teal} style={{ flexShrink: 0, marginTop: 1 }} />
          <p style={{ margin: 0, fontSize: 14, color: "#5e5346", lineHeight: 1.6 }}>
            Le site sert à organiser, mais <b>l'essentiel de la vie de l'association se passe sur Signal</b> : c'est là que les moments jeux se calent, que les places de dernière minute se prennent et que l'on discute au quotidien. S'y inscrire <b>n'est pas obligatoire</b>, mais c'est <b>de loin le plus pratique</b> — sans cela, vous risquez de passer à côté de beaucoup de choses.
          </p>
        </div>

        <div style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 700, color: C.navy, fontSize: 15, marginBottom: 8 }}>1. Rejoignez au moins une conversation</div>
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr)", gap: 8, marginBottom: 18 }}>
          {SIGNAL_GROUPS.map((gp) => {
            const Ico = gp.icon;
            return (
              <a key={gp.name} href={gp.url} target="_blank" rel="noopener noreferrer"
                style={{ display: "flex", alignItems: "center", gap: 11, textDecoration: "none", background: "#fff", border: "1.5px solid #e6dcc9", borderRadius: 12, padding: "10px 13px" }}>
                <span style={{ width: 32, height: 32, borderRadius: 9, background: `${gp.color}1f`, display: "grid", placeItems: "center", flexShrink: 0 }}><Ico size={16} color={gp.color} /></span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "block", fontFamily: "'Fredoka',sans-serif", fontWeight: 700, color: C.navy, fontSize: 14 }}>{gp.name}</span>
                  <span style={{ display: "block", fontSize: 12.5, color: "#8a7c6a", lineHeight: 1.4 }}>{gp.desc}</span>
                </span>
                <ExternalLink size={15} color="#b6a78f" style={{ flexShrink: 0 }} />
              </a>
            );
          })}
        </div>

        <div style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 700, color: C.navy, fontSize: 15, marginBottom: 8 }}>2. Présentez-vous</div>
        <div style={{ background: "rgba(232,163,23,.1)", border: `1px solid ${C.amber}55`, borderRadius: 13, padding: "13px 15px", marginBottom: 14 }}>
          <p style={{ margin: "0 0 8px", fontSize: 13.5, color: "#5e5346", lineHeight: 1.6 }}>
            Quelques mots suffisent, pour que l'on sache qui vous êtes :
          </p>
          <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13.5, color: "#5e5346", lineHeight: 1.75 }}>
            <li>qui vous êtes (prénom, d'où vous venez) ;</li>
            <li>si vous êtes <b>joueur régulier</b>, <b>vacancier régulier dans la région</b> ou <b>vacancier de passage</b> ;</li>
            <li>vos <b>moments idéaux pour jouer</b> (jours, horaires) ;</li>
            <li>et, si vous voulez, les jeux que vous aimez.</li>
          </ul>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr)", gap: 8, marginBottom: 14 }}>
          {[
            { v: "signal", t: "Je me présente sur Signal", d: "Le plus simple : rejoignez « Organisation jeux » et dites-nous bonjour." },
            { v: "mail",   t: "Je préfère envoyer un e-mail", d: `Écrivez-nous à ${ASSO_EMAIL} — nous vous répondrons en vous redonnant les liens Signal.` },
          ].map((opt) => {
            const active = pledgeWay === opt.v;
            return (
              <button key={opt.v} type="button" onClick={() => setPledgeWay(opt.v)}
                style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "11px 14px", borderRadius: 12, cursor: "pointer", textAlign: "left", border: `2px solid ${active ? C.teal : "#e6dcc9"}`, background: active ? "rgba(30,138,138,.07)" : "#fff" }}>
                <span style={{ width: 18, height: 18, borderRadius: "50%", border: `2px solid ${active ? C.teal : "#c5b69c"}`, marginTop: 2, flexShrink: 0, display: "grid", placeItems: "center" }}>
                  {active && <span style={{ width: 8, height: 8, borderRadius: "50%", background: C.teal }} />}
                </span>
                <span>
                  <span style={{ display: "block", fontFamily: "'Fredoka',sans-serif", fontWeight: 600, color: C.navy, fontSize: 14 }}>{opt.t}</span>
                  <span style={{ display: "block", fontSize: 12.5, color: "#8a7c6a", marginTop: 2, lineHeight: 1.45 }}>{opt.d}</span>
                </span>
              </button>
            );
          })}
        </div>

        <label style={{ display: "flex", alignItems: "flex-start", gap: 11, padding: "12px 14px", borderRadius: 12, background: pledgeOk ? "rgba(30,138,138,.1)" : "rgba(26,58,92,.05)", border: `1.5px solid ${pledgeOk ? C.teal : "transparent"}`, marginBottom: 16, cursor: "pointer" }}>
          <input type="checkbox" checked={pledgeOk} onChange={(ev) => setPledgeOk(ev.target.checked)} style={{ width: 19, height: 19, accentColor: C.teal, marginTop: 1, flexShrink: 0 }} />
          <span style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 600, color: C.navy, fontSize: 14, lineHeight: 1.5 }}>
            En m'inscrivant, je m'engage à me présenter à l'association — soit en rejoignant une conversation Signal et en m'y présentant, soit en envoyant un e-mail de présentation.
          </span>
        </label>

        {err && <div style={{ background: "rgba(181,40,58,.1)", color: C.red, padding: "10px 14px", borderRadius: 11, fontSize: 13.5, fontWeight: 600, marginBottom: 14 }}>{err}</div>}

        <div style={{ display: "flex", gap: 10 }}>
          <Btn variant="soft" size="lg" onClick={() => { setPledge(null); setErr(""); }} style={{ flex: 1 }}>Retour</Btn>
          <Btn variant="amber" size="lg" disabled={!pledgeOk || busy} onClick={() => (pledge === "google" ? runGoogle() : doRegister())} style={{ flex: 2 }}>
            {busy ? <Loader2 size={18} className="aladj-spin" /> : <><Sparkles size={18} /> {pledge === "google" ? "Continuer avec Google" : "Créer mon compte"}</>}
          </Btn>
        </div>
      </Modal>
    );
  }

  // Écran de bienvenue après inscription : rappelle de se présenter à l'association.
  if (welcome) {
    return (
      <Modal open onClose={onClose} title="Bienvenue à l'ALADJ !" width={480}>
        <div style={{ textAlign: "center", padding: "6px 4px" }}>
          <div style={{ width: 60, height: 60, borderRadius: "50%", background: "rgba(30,138,138,.12)", display: "grid", placeItems: "center", margin: "0 auto 16px" }}>
            <Sparkles size={28} color={C.teal} />
          </div>
          <h3 style={{ fontFamily: "'Fredoka',sans-serif", color: C.navy, fontSize: 20, margin: "0 0 6px" }}>
            Compte créé — bienvenue {welcome.name} !
          </h3>
          {welcome.needsConfirm && (
            <p style={{ fontSize: 14, color: "#b5283a", fontWeight: 600, margin: "0 0 14px", lineHeight: 1.5 }}>
              Pensez d'abord à confirmer votre adresse via le mail que nous venons de vous envoyer, puis connectez-vous.
            </p>
          )}
          <div style={{ background: "rgba(232,163,23,.1)", border: `1px solid ${C.amber}`, borderRadius: 14, padding: "16px 18px", margin: "0 0 16px", textAlign: "left" }}>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <Info size={18} color={C.amber} style={{ flexShrink: 0, marginTop: 2 }} />
              <p style={{ fontSize: 14, color: "#5e5346", lineHeight: 1.6, margin: 0 }}>
                <b>Dernière étape : présentez-vous&nbsp;!</b> Dites-nous qui vous êtes, si vous êtes joueur régulier, vacancier régulier dans la région ou de passage, et vos moments idéaux pour jouer.
              </p>
            </div>
          </div>

          {welcome.way === "mail" ? (
            <div style={{ textAlign: "left", marginBottom: 20 }}>
              <a href={`mailto:${ASSO_EMAIL}?subject=${encodeURIComponent("Présentation - nouveau membre ALADJ")}&body=${encodeURIComponent(["Bonjour,", "", "Je viens de creer mon compte sur aladj.fr et je me presente :", "", "- Qui je suis : ", "- Je suis plutot : joueur regulier / vacancier regulier dans la region / vacancier de passage", "- Mes moments ideaux pour jouer (jours, horaires) : ", "- Les jeux que j'aime : ", "", "A bientot autour d'une table !"].join("\n"))}`}
                style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 9, width: "100%", boxSizing: "border-box", background: C.teal, color: "#fff", fontFamily: "'Fredoka',sans-serif", fontWeight: 700, fontSize: 14.5, padding: "12px 18px", borderRadius: 12, textDecoration: "none" }}>
                <Mail size={17} /> Écrire mon message de présentation
              </a>
              <p style={{ fontSize: 12.5, color: "#8a7c6a", margin: "9px 2px 0", lineHeight: 1.55 }}>
                Le message est déjà pré-rempli, il ne vous reste qu'à compléter. Nous vous répondrons en vous redonnant les liens des conversations Signal — c'est là que tout s'organise.
              </p>
            </div>
          ) : (
            <div style={{ textAlign: "left", marginBottom: 20 }}>
              <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr)", gap: 7 }}>
                {SIGNAL_GROUPS.map((gp) => {
                  const Ico = gp.icon;
                  return (
                    <a key={gp.name} href={gp.url} target="_blank" rel="noopener noreferrer"
                      style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", background: "#fff", border: "1.5px solid #e6dcc9", borderRadius: 11, padding: "9px 12px" }}>
                      <span style={{ width: 28, height: 28, borderRadius: 8, background: `${gp.color}1f`, display: "grid", placeItems: "center", flexShrink: 0 }}><Ico size={15} color={gp.color} /></span>
                      <span style={{ flex: 1, fontFamily: "'Fredoka',sans-serif", fontWeight: 700, color: C.navy, fontSize: 13.5 }}>{gp.name}</span>
                      <ExternalLink size={14} color="#b6a78f" />
                    </a>
                  );
                })}
              </div>
              <p style={{ fontSize: 12.5, color: "#8a7c6a", margin: "9px 2px 0", lineHeight: 1.55 }}>
                Rejoignez au moins «&nbsp;Organisation jeux&nbsp;» et présentez-vous. Vous préférez l'e-mail&nbsp;? Écrivez à <a href={`mailto:${ASSO_EMAIL}`} style={{ color: C.teal, fontWeight: 600 }}>{ASSO_EMAIL}</a>.
              </p>
            </div>
          )}
          <Btn full variant="teal" size="lg" onClick={() => { onClose(); setToast(`Bienvenue ${welcome.name} !`); }}>
            <Check size={17} /> J'ai compris
          </Btn>
        </div>
      </Modal>
    );
  }

  return (
    <Modal open onClose={onClose} title={tab === "login" ? "Connexion" : "Rejoindre l'association"} width={480}>
      <div style={{ display: "flex", gap: 6, marginBottom: 20, background: "rgba(26,58,92,.06)", padding: 5, borderRadius: 13 }}>
        {[["login", "J'ai un compte"], ["register", "Je m'inscris"]].map(([k, lbl]) => (
          <button key={k} onClick={() => { setTab(k); setErr(""); setInfo(""); }} style={{
            flex: 1, padding: "9px", border: "none", borderRadius: 9, cursor: "pointer", fontFamily: "'Fredoka',sans-serif", fontWeight: 700, fontSize: 14,
            background: tab === k ? "#fff" : "transparent", color: tab === k ? C.navy : "#9c8d79", boxShadow: tab === k ? "0 2px 8px rgba(18,41,63,.1)" : "none",
          }}>{lbl}</button>
        ))}
      </div>

      {info && <div style={{ background: "rgba(30,138,138,.12)", color: C.teal, padding: "12px 14px", borderRadius: 11, fontSize: 13.5, fontWeight: 600, marginBottom: 14, lineHeight: 1.5 }}>{info}</div>}

      {/* Connexion Google */}
      <button onClick={() => { setErr(""); if (tab === "register") { setPledgeOk(false); setPledgeWay("signal"); setPledge("google"); return; } runGoogle(); }}
        style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "12px", borderRadius: 12, border: "1.5px solid #e0d4bf", background: "#fff", cursor: "pointer", fontFamily: "'Fredoka',sans-serif", fontWeight: 600, fontSize: 14.5, color: C.navy, marginBottom: 16 }}>
        <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
          <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z"/>
          <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z"/>
          <path fill="#FBBC05" d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.01-2.33z"/>
          <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z"/>
        </svg>
        Continuer avec Google
      </button>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <span style={{ flex: 1, height: 1, background: "#ece2d0" }} />
        <span style={{ fontSize: 12.5, color: "#a89a86" }}>ou par e-mail</span>
        <span style={{ flex: 1, height: 1, background: "#ece2d0" }} />
      </div>

      {tab === "register" && (
        <Field label="Nom ou pseudo">
          <TextInput value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex. Camille" />
        </Field>
      )}
      <Field label="Adresse e-mail">
        <TextInput type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="vous@exemple.fr" />
      </Field>
      <Field label="Mot de passe" hint={tab === "register" ? "Au moins 6 caractères." : undefined}>
        <div style={{ position: "relative" }}>
          <TextInput type={showPwd ? "text" : "password"} value={form.pwd} onChange={(e) => setForm({ ...form, pwd: e.target.value })} placeholder="••••••••"
            onKeyDown={(e) => e.key === "Enter" && tab === "login" && submit()} style={{ paddingRight: 44 }} />
          <button type="button" onClick={() => setShowPwd(!showPwd)} aria-label={showPwd ? "Masquer" : "Afficher"}
            style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#9c8d79", padding: 6, display: "grid", placeItems: "center" }}>
            {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </Field>

      {tab === "login" && (
        <button type="button" onClick={() => { setForgot(true); setForgotSent(false); setErr(""); }}
          style={{ background: "none", border: "none", color: C.teal, cursor: "pointer", fontFamily: "'Nunito',sans-serif", fontWeight: 700, fontSize: 13, padding: 0, marginTop: -4, marginBottom: 14, marginLeft: "auto", display: "block" }}>
          Mot de passe oublié ?
        </button>
      )}

      {tab === "register" && (
        <Field label="Confirmer le mot de passe">
          <div style={{ position: "relative" }}>
            <TextInput type={showPwd ? "text" : "password"} value={form.pwd2} onChange={(e) => setForm({ ...form, pwd2: e.target.value })} placeholder="••••••••"
              onKeyDown={(e) => e.key === "Enter" && submit()} style={{ paddingRight: 44 }} />
            {form.pwd2 && (
              <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)" }}>
                {form.pwd === form.pwd2 ? <Check size={18} color={C.teal} /> : <X size={18} color={C.red} />}
              </span>
            )}
          </div>
        </Field>
      )}

      {tab === "register" && (
        <p style={{ fontSize: 12.5, color: "#8a7c6a", margin: "0 0 14px", lineHeight: 1.5 }}>
          Tout le monde s'inscrit comme <b>membre</b> (gratuit). Le statut de <b>membre décisionnaire</b> (cotisation 20 €/an, voix délibérative en AG) s'obtient ensuite depuis Mon espace, en espèces ou par PayPal entre proches.
          <br />Une dernière étape vous rappellera nos conversations <b>Signal</b>, où se passe l'essentiel de la vie de l'association.
        </p>
      )}

      {err && <div style={{ background: "rgba(181,40,58,.1)", color: C.red, padding: "10px 14px", borderRadius: 11, fontSize: 13.5, fontWeight: 600, marginBottom: 14 }}>{err}</div>}
      <Btn onClick={submit} disabled={busy} full size="lg" variant={tab === "login" ? "primary" : "amber"}>
        {busy ? <Loader2 size={18} className="aladj-spin" /> : (tab === "login" ? <><LogIn size={18} /> Se connecter</> : <><Sparkles size={18} /> Créer mon compte</>)}
      </Btn>
    </Modal>
  );
}

/* =============================================================================
   PAGE — ACCUEIL (Landing)
   ============================================================================= */
function Dice({ color, n, style }) {
  const pips = {
    1: [[50, 50]], 2: [[30, 30], [70, 70]], 3: [[28, 28], [50, 50], [72, 72]],
    4: [[30, 30], [70, 30], [30, 70], [70, 70]], 5: [[28, 28], [72, 28], [50, 50], [28, 72], [72, 72]],
    6: [[30, 25], [70, 25], [30, 50], [70, 50], [30, 75], [70, 75]],
  }[n];
  return (
    <svg viewBox="0 0 100 100" style={style}>
      <rect x="6" y="6" width="88" height="88" rx="20" fill={color} />
      <rect x="6" y="6" width="88" height="88" rx="20" fill="url(#dg)" />
      <defs><linearGradient id="dg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#fff" stopOpacity=".25" /><stop offset="1" stopColor="#000" stopOpacity=".12" /></linearGradient></defs>
      {pips.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r="7.5" fill="#fff" />)}
    </svg>
  );
}

/* =============================================================================
   GUIDE — mode d'emploi du site et du chronomètre, avec illustrations.
   Les illustrations réutilisent les vrais composants du site : elles restent
   automatiquement fidèles à l'interface.
   ============================================================================= */
// Encadré d'illustration d'une réponse du guide.
function Illu({ children, caption }) {
  return (
    <div style={{ margin: "12px 0 4px" }}>
      <div style={{ background: "#fff", border: "1.5px dashed #ddd2bd", borderRadius: 13, padding: "16px 14px", display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", justifyContent: "center" }}>
        {children}
      </div>
      {caption && <div style={{ fontSize: 11.5, color: "#9c8d79", textAlign: "center", marginTop: 5 }}>{caption}</div>}
    </div>
  );
}

// Question dépliable du guide.
function FaqItem({ q, children }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ background: C.paper, border: "1px solid #ece2d0", borderRadius: 14, overflow: "hidden" }}>
      <button onClick={() => setOpen(!open)} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", textAlign: "left", padding: "13px 16px", background: "none", border: "none", cursor: "pointer" }}>
        <span style={{ flex: 1, fontFamily: "'Fredoka',sans-serif", fontWeight: 600, color: C.navy, fontSize: 15 }}>{q}</span>
        <ChevronDown size={17} color="#a89a86" style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform .15s", flexShrink: 0 }} />
      </button>
      {open && <div style={{ padding: "0 16px 15px", fontSize: 14, color: "#5e5346", lineHeight: 1.65 }}>{children}</div>}
    </div>
  );
}

// Faux bouton d'illustration (non cliquable), pour montrer l'interface.
function MockBtn({ color = C.teal, children, soft }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 11, background: soft ? `${color}18` : color, color: soft ? color : "#fff", fontFamily: "'Fredoka',sans-serif", fontWeight: 600, fontSize: 13.5, border: soft ? `1.5px solid ${color}55` : "none", pointerEvents: "none" }}>
      {children}
    </span>
  );
}

function GuidePage() {
  const histo = [
    { year: "2010", title: "La naissance", text: <>L'association <b>« À l'assaut des jeux ! »</b> est fondée à Coutances par <b>Fabien Delisle</b>, <b>Julie Klatka</b> et <b>Martin Hamel</b>, trois passionnés bien décidés à partager le virus du jeu de société.</> },
    { year: "2010-2013", title: "Les premières années", text: <>Un vendredi soir par mois au bar coutançais <b>l'Oreille cassée</b>, et un dimanche par mois aux <b>Unelles</b> (l'après-midi et en soirée), où la ludothèque de l'association est entreposée. En 2012, <b>Matthieu Quennet</b>, actuel président, rejoint l'aventure. En 2013, les soirées au bar s'arrêtent : cap sur les Unelles.</> },
    { year: "2014", title: "La presse en parle", text: <>La presse locale consacre un article à l'association : « Quand le virus du jeu empêche de vieillir ». On y découvre une vingtaine d'adhérents, des dimanches qui filent « de 14 h 30 jusqu'à minuit… et parfois même après », et une présence remarquée au <b>Festival du jeu et du jouet</b> de Coutances.</> },
    { year: "Au fil des ans", title: "Au-delà des plateaux", text: <>L'association, c'est aussi des sorties entre membres, hors des tables de jeux : <b>paintball</b>, <b>acrobranche</b>, <b>bowling</b>… parce que le jeu est avant tout une histoire de bande.</> },
    { year: "2019", title: "L'arrivée de Nicolas", text: <><b>Nicolas Richard</b>, actuel secrétaire, rejoint l'association.</> },
    { year: "2020", title: "Pause forcée", text: <>Les contraintes du Covid mettent l'association en sommeil. <b>Nicolas Richard</b> maintient le lien entre les membres en organisant chez lui des soirées <b>jeux Détective</b> et une campagne <b>Gloomhaven</b>. Les boîtes de l'association prennent la poussière — pas les joueurs.</> },
    { year: "2022", title: "La renaissance", text: <>L'ALADJ reprend du service dans un <b>nouveau local à Gouville-sur-Mer</b>. Les moments jeux s'organisent alors via l'application Signal.</> },
    { year: "2026", title: "Une nouvelle ère", text: <>Le site <b>aladj.fr</b> est entièrement refait : les moments jeux s'y organisent, la ludothèque s'y explore, et l'association s'ouvre à plus de monde. Le bureau actuel : <b>Matthieu Quennet</b> (président), <b>Fabien Delisle</b> (trésorier et cofondateur) et <b>Nicolas Richard</b> (secrétaire).</> },
  ];

  const sections = [
    {
      icon: "📜", title: "L'histoire de l'association",
      custom: (
        <div style={{ position: "relative", paddingLeft: 26 }}>
          <div style={{ position: "absolute", left: 9, top: 6, bottom: 6, width: 3, borderRadius: 3, background: "linear-gradient(180deg, #1E8A8A, #E8A317)" }} />
          {histo.map((h, i) => (
            <div key={i} style={{ position: "relative", marginBottom: i === histo.length - 1 ? 0 : 18 }}>
              <span style={{ position: "absolute", left: -26, top: 4, width: 19, height: 19, borderRadius: "50%", background: C.paper, border: `4px solid ${i === histo.length - 1 ? C.amber : C.teal}` }} />
              <div style={{ background: C.paper, border: "1px solid #ece2d0", borderRadius: 14, padding: "13px 16px" }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap", marginBottom: 4 }}>
                  <span style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 700, fontSize: 13, color: "#fff", background: C.navy, borderRadius: 999, padding: "2px 11px" }}>{h.year}</span>
                  <span style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 700, fontSize: 15.5, color: C.navy }}>{h.title}</span>
                </div>
                <p style={{ margin: 0, fontSize: 14, color: "#5e5346", lineHeight: 1.65 }}>{h.text}</p>
              </div>
            </div>
          ))}
        </div>
      ),
    },
    {
      icon: "🚀", title: "Premiers pas",
      items: [
        {
          q: "Créer un compte et se connecter",
          a: <>
            <p style={{ margin: "0 0 8px" }}>Depuis l'accueil, cliquez sur <b>Adhérer</b> pour créer un compte (e-mail + mot de passe, ou directement avec Google).</p>
            <p style={{ margin: "0 0 8px" }}>Avant la création effective du compte, un <b>écran d'engagement</b> s'affiche. Il rappelle que <b>l'essentiel de la vie de l'association se passe sur Signal</b> : s'y inscrire n'est pas obligatoire, mais c'est de loin le plus pratique pour ne rien rater. Vous y trouvez les liens des trois conversations et vous choisissez comment vous présenter : <b>sur Signal</b> ou <b>par e-mail</b>. Une case à cocher confirme cet engagement.</p>
            <p style={{ margin: "0 0 8px" }}>Se présenter, c'est dire en quelques mots <b>qui vous êtes</b>, si vous êtes <b>joueur régulier</b>, <b>vacancier régulier dans la région</b> ou <b>vacancier de passage</b>, et vos <b>moments idéaux pour jouer</b>. Si vous choisissez l'e-mail, un message pré-rempli vous est proposé sur l'écran de bienvenue — nous vous répondrons en vous redonnant les liens Signal.</p>
            <p style={{ margin: 0 }}>Mot de passe oublié ? Sur l'écran de connexion, cliquez sur <b style={{ color: C.teal }}>« Mot de passe oublié ? »</b> : vous recevrez un lien par e-mail pour en choisir un nouveau.</p>
          </>,
        },
        {
          q: "Devenir membre décisionnaire",
          a: <>
            <p style={{ margin: "0 0 8px" }}>Tout le monde s'inscrit gratuitement comme <b>membre</b>. Le statut de <b>membre décisionnaire</b> ({COTISATION_EUR} €/an) s'obtient depuis le bandeau en haut de <b>Mon espace</b>, au choix <b>en espèces</b> auprès du bureau ou par <b>PayPal entre proches</b> au trésorier {PAYPAL_TRESORIER_NOM} ({PAYPAL_TRESORIER}) — dans ce cas, indiquez en motif <b>ALADJ</b> suivi de votre nom sur le site, sans quoi le trésorier ne peut pas rattacher le paiement à votre compte. Le paiement par carte arrive prochainement ; chèques et virements bancaires sont refusés. Le statut dure <b>365 jours</b> ; un renouvellement <b>ajoute</b> 365 jours au restant (le bandeau vous prévient 15 jours avant l'échéance).</p>
            <p style={{ margin: "0 0 8px" }}><b>Concrètement, qu'est-ce que ça change sur le site ?</b> Une seule chose, mais elle compte : l'onglet <b>👑 Décisionnaire</b> apparaît dans le menu. Tout le reste du site — ludothèque, moments jeux, parties, chrono, badges, commentaires — est <b>identique pour les deux statuts</b>.</p>
            <ul style={{ margin: "0 0 8px", paddingLeft: 20, lineHeight: 1.75 }}>
              <li><b>Membre non décisionnaire</b> : l'onglet n'existe pas. Il ne voit ni les idées, ni les votes, ni les commentaires qui s'y échangent — c'est verrouillé côté serveur, pas seulement masqué à l'écran.</li>
              <li><b>Membre décisionnaire</b> : il ouvre l'onglet, propose et soutient des idées, lance des votes, y vote, en discute dans la zone de commentaires, et reçoit une notification à chaque nouveau vote comme à chaque nouveau commentaire.</li>
            </ul>
            <p style={{ margin: 0 }}>S'y ajoutent les avantages hors site : <b>voix délibérative en assemblée générale</b>, <b>pass Ludovore</b> offert un an (valeur 29,99 €) et <b>dispense de caution</b> lors d'une location. Si le statut expire, l'onglet disparaît simplement : rien n'est perdu, tout revient au renouvellement.</p>
          </>,
        },
        {
          q: "Administrateurs : modifier le profil d'un membre",
          a: <>
            <p style={{ margin: "0 0 8px" }}>Les <b>administrateurs</b> peuvent ouvrir et modifier le profil de n'importe quel membre, par exemple pour corriger un nom, cocher un <b>compte enfant</b>, remettre d'aplomb une date de naissance ou retirer une présentation inappropriée.</p>
            <p style={{ margin: "0 0 8px" }}>Deux accès, au choix :</p>
            <ul style={{ margin: "0 0 8px", paddingLeft: 20, lineHeight: 1.75 }}>
              <li>depuis le <b>trombinoscope</b> en vue administrateur : le bouton <b>crayon</b>, à côté des actions de gestion ;</li>
              <li>depuis la <b>fiche du membre</b> : le bouton <b>« Modifier »</b>, à côté de son statut.</li>
            </ul>
            <p style={{ margin: 0 }}>La fenêtre est identique à « Mon profil », avec un bandeau violet rappelant de qui il s'agit. <b>Le membre n'est pas prévenu</b> de la modification : prévenez-le de vive voix ou sur Signal si le changement le concerne directement. Les administrateurs ne peuvent pas modifier ainsi le statut décisionnaire, le bannissement ou la suppression d'un compte — ces actions restent séparées, dans le trombinoscope.</p>
          </>,
        },
        {
          q: "Les comptes enfants (la tétine)",
          a: <>
            <p style={{ margin: "0 0 8px" }}>Les <b>enfants peuvent tout à fait avoir un compte</b> sur aladj.fr. Dans <b>Mon profil</b>, une case <b>« Compte enfant (moins de {CHILD_AGE_LIMIT} ans) »</b> fait apparaître une <b>tétine</b> à côté du nom, partout sur le site — trombinoscope, fiche membre, moments jeux, commentaires, composeur de tablée. C'est le pendant de la couronne des membres décisionnaires.</p>
            <Illu caption="La tétine accompagne le nom du membre, comme la couronne pour les décisionnaires.">
              <span style={{ display: "flex", alignItems: "center", gap: 7, background: "rgba(30,138,138,.1)", padding: "6px 12px", borderRadius: 999 }}>
                <span style={{ width: 24, height: 24, borderRadius: 7, background: C.teal, color: "#fff", display: "grid", placeItems: "center", fontFamily: "'Fredoka',sans-serif", fontWeight: 700, fontSize: 12 }}>T</span>
                <span style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 600, color: C.navy, fontSize: 13.5 }}>Timéo</span>
                <PacifierIcon size={13} />
              </span>
            </Illu>
            <p style={{ margin: "8px 0" }}>Si la <b>date de naissance complète</b> (jour, mois et année) est renseignée dans le profil, la tétine <b>disparaît automatiquement le jour des {CHILD_AGE_LIMIT} ans</b> — rien à faire. Sans année de naissance, elle reste tant que la case est cochée.</p>
            <p style={{ margin: 0 }}>Ce qu'un compte enfant peut faire : tout consulter, noter des jeux, tenir sa ludothèque, et <b>participer aux moments jeux privés</b> auxquels il est invité. Ce qu'il ne peut pas faire avant {CHILD_AGE_LIMIT} ans : <b>s'inscrire aux moments jeux de l'association ouverts à tous</b>, en présentiel comme sur Board Game Arena — le bouton d'inscription est alors remplacé par « Réservé aux {CHILD_AGE_LIMIT} ans et plus ».</p>
          </>,
        },
        {
          q: "Installer le site comme une application sur mon téléphone",
          a: <>
            <p style={{ margin: "0 0 8px" }}>Le site s'installe comme une vraie appli, avec son icône : sur <b>iPhone</b>, ouvrez aladj.fr dans Safari → bouton Partager → <b>« Sur l'écran d'accueil »</b>. Sur <b>Android</b>, Chrome propose « Installer l'application » (ou menu ⋮ → Ajouter à l'écran d'accueil).</p>
            <p style={{ margin: 0 }}>Dans l'appli, le bouton <RefreshCw size={13} style={{ verticalAlign: "-2px" }} /> en haut à droite recharge les données — pratique pour voir tout de suite ce qu'un autre membre vient d'ajouter.</p>
          </>,
        },
        {
          q: "Activer les notifications",
          a: <>
            <p style={{ margin: "0 0 8px" }}>Dans <b>Mon espace</b>, activez les notifications pour être prévenu sur votre téléphone : commentaires sur vos jeux, envies de découverte, invitations aux moments, parties à confirmer, quorum atteint…</p>
            <p style={{ margin: 0 }}>Sur iPhone, les notifications ne fonctionnent que depuis <b>l'appli installée</b> sur l'écran d'accueil (pas depuis Safari). Si vous avez refusé par le passé : Réglages → Notifications → ALADJ pour réactiver.</p>
          </>,
        },
        {
          q: "Compléter mon profil (et mes couleurs de jeu préférées)",
          a: <>
            <p style={{ margin: "0 0 8px" }}>Menu → <b>Mon profil</b> : photo, ville, présentation, mécaniques préférées, votre <b>anniversaire</b> (jour et mois suffisent, l'année est facultative — il apparaîtra 🎂 dans le calendrier des moments) et vos <b>couleurs de jeu préférées</b> : cliquez-en jusqu'à 3, dans l'ordre de préférence.</p>
            <p style={{ margin: "0 0 8px" }}>Vous pouvez aussi déclarer vos <b>mécaniques détestées</b> (sans limite de nombre) : les types de jeux auxquels vous ne voulez <b>absolument pas</b> jouer. Cette information est utilisée par le composeur de tablée — aucun jeu comportant l'une de ces mécaniques ne sera proposé à une tablée dont vous faites partie.</p>
            <Illu caption="Vos couleurs apparaissent à côté de votre nom dans les moments jeux — fini les négociations pour le pion rouge.">
              <span style={{ display: "flex", alignItems: "center", gap: 7, background: "rgba(30,138,138,.1)", padding: "6px 12px", borderRadius: 999 }}>
                <span style={{ width: 24, height: 24, borderRadius: 7, background: C.teal, color: "#fff", display: "grid", placeItems: "center", fontFamily: "'Fredoka',sans-serif", fontWeight: 700, fontSize: 12 }}>L</span>
                <span style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 600, color: C.navy, fontSize: 13.5 }}>Léa</span>
                <ColorPrefs colors={["rouge", "bleu", "vert"]} />
              </span>
            </Illu>
          </>,
        },
        {
          q: "Mon espace : les 4 tuiles du haut sont cliquables",
          a: <>
            <p style={{ margin: "0 0 8px" }}>En haut de <b>Mon espace</b>, quatre tuiles résument votre activité. Elles ne sont plus de simples compteurs : un petit chevron indique qu'on peut <b>cliquer dessus</b>.</p>
            <ul style={{ margin: "0 0 8px", paddingLeft: 20 }}>
              <li><b>Jeux apportés</b> — vous fait descendre directement sur <b>Ma ludothèque</b>, tout en bas de la page.</li>
              <li><b>Extensions</b> — ouvre la liste de vos extensions ; cliquez sur l'une d'elles pour ouvrir la fiche du jeu auquel elle se rattache.</li>
              <li><b>Jeux notés</b> — ouvre la liste de vos notes, de la meilleure à la moins bonne ; un clic ouvre la fiche du jeu.</li>
              <li><b>Statut</b> — ouvre le rappel des trois statuts (membre, membre décisionnaire, compte enfant) : ce que chacun permet et ce qu'il ne permet pas. Le vôtre est encadré en couleur.</li>
            </ul>
            <p style={{ margin: 0 }}>Vos <b>notifications</b> sont désormais placées <b>juste au-dessus</b> du bouton « 🎲 Enregistrer une partie jouée » : elles se voient tout de suite, sans avoir à faire défiler la page.</p>
          </>,
        },
        {
          q: "Les suggestions de jeux : le cœur, la croix, et ce que le site en apprend",
          a: <>
            <p style={{ margin: "0 0 8px" }}>Dans <b>Mon espace</b>, la section <b>Suggestions</b> propose désormais <b>12 jeux</b> (deux rangées de six sur grand écran). Ils sont choisis d'après vos notes, les goûts des membres qui notent comme vous, vos mécaniques et formats favoris, et les envies de découverte de la bande. Une étiquette turquoise dit toujours <i>pourquoi</i> le jeu vous est proposé.</p>
            <p style={{ margin: "0 0 8px" }}>Deux boutons sur chaque vignette :</p>
            <ul style={{ margin: "0 0 8px", paddingLeft: 20, lineHeight: 1.75 }}>
              <li>Le <b>cœur</b> enregistre une <b>envie de découvrir</b>. C'est le signal le plus utile : il prévient les propriétaires du jeu, il compte pour le composeur de tablée, et il oriente aussi les suggestions des membres proches de vous.</li>
              <li>La <b>croix</b> écarte le jeu — mais elle vous demande d'abord <b>pourquoi</b>, en un seul tap.</li>
            </ul>
            <p style={{ margin: "0 0 8px" }}><b>Le motif compte vraiment.</b> « Les mécaniques ne me tentent pas » éloigne les jeux du même genre ; « le format ne me convient pas » éloigne cette fourchette de joueurs et cette durée. À l'inverse, « je le connais déjà » et « le thème ne m'attire pas » <b>n'apprennent rien</b> au moteur : le jeu disparaît, vos goûts restent intacts. C'est voulu — traiter « je connais » comme un rejet reviendrait à fuir des jeux qui vous plaisaient.</p>
            <p style={{ margin: "0 0 8px" }}><b>« Pas maintenant »</b> ne masque que <b>90 jours</b> : le jeu revient tout seul après. Et si vous choisissez <b>« j'y ai déjà joué, je n'ai pas aimé »</b>, la fiche du jeu s'ouvre aussitôt : une <b>note</b> vaut bien mieux qu'un rejet, c'est le signal le plus fort dont dispose le site.</p>
            <p style={{ margin: 0 }}><b>Rien n'est irréversible.</b> Sous la grille, le lien « <i>N suggestions masquées — revoir</i> » liste tout ce que vous avez écarté, avec le motif et la date, et permet de <b>réafficher</b> un jeu d'un clic. Utile : dans une ludothèque qui n'est pas infinie, à force d'écarter on finit par ne plus rien recevoir. Vos motifs sont <b>strictement privés</b> — aucun autre membre, administrateur compris, ne les voit.</p>
          </>,
        },
      ],
    },
    {
      icon: "📚", title: "La ludothèque",
      items: [
        {
          q: "Trouver un jeu",
          a: <p style={{ margin: 0 }}>Page <b>Ludothèque</b> : recherche par nom (les accents ne comptent pas), filtres par nombre de joueurs, durée ou mécanique, tri par note, et deux affichages (cartes ou liste). La grille se charge par tranches de 60 — « Afficher plus » pour continuer, ou affinez la recherche.</p>,
        },
        {
          q: "Les mécaniques de jeu",
          a: <p style={{ margin: 0 }}>Chaque fiche porte des <b>mécaniques</b> (coopératif, jeu de plis, deck-building…) qui alimentent les filtres de la ludothèque et les recommandations. À la création d'une fiche, une liste de suggestions est proposée — et vous pouvez toujours saisir une mécanique personnalisée. Cette liste est entretenue par les administrateurs (depuis <b>Mon espace</b>) : ils peuvent ajouter, renommer, fusionner ou supprimer des mécaniques, et ces changements s'appliquent automatiquement à toutes les fiches — y compris les noms anglais issus des imports BoardGameGeek.</p>,
        },
        {
          q: "Noter un jeu, avoir envie de le découvrir",
          a: <p style={{ margin: 0 }}>Ouvrez la fiche d'un jeu pour lui donner votre note (re-cliquez la même note pour la retirer). Pas encore joué ? Le cœur <Heart size={13} style={{ verticalAlign: "-2px", color: C.red }} /> « envie de découvrir » prévient les propriétaires du jeu — parfait pour provoquer une partie au prochain moment jeux.</p>,
        },
        {
          q: "« Notre notation » : comprendre l'échelle",
          a: <>
            <p style={{ margin: "0 0 8px" }}>Sur chaque fiche de jeu, juste sous le <b>nombre d'avis</b>, un lien <b style={{ color: C.amber }}>« Notre notation »</b> ouvre le rappel de l'échelle ALADJ. Juger la qualité « objective » d'un jeu est difficile, mais on sait toujours si on a envie d'y rejouer — c'est cette envie que nos notes mesurent.</p>
            <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr)", gap: 5, margin: "0 0 8px" }}>
              {RATING_SCALE.map((sc) => (
                <div key={sc.v} style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <span style={{ flexShrink: 0, width: 110 }}><Stars value={sc.v} readOnly size={14} /></span>
                  <span style={{ fontSize: 13.5, color: "#5e5346" }}>{sc.t}</span>
                </div>
              ))}
            </div>
            <p style={{ margin: 0 }}>La demi-étoile est autorisée (2,5 ; 4,5…). La note affichée sur la fiche est la <b>moyenne</b> des notes des membres — cliquez sur cette moyenne pour voir qui a voté.</p>
          </>,
        },
        {
          q: "Les fiches de référence : des jeux que personne ne possède",
          a: <>
            <p style={{ margin: "0 0 8px" }}>On ne joue pas qu'à nos propres jeux : il y a Board Game Arena, les conventions, les soirées chez des amis extérieurs à l'asso. Pour que ces parties comptent quand même, la ludothèque accepte des <b>fiches de référence</b> : des fiches de jeux que <b>personne ne possède</b>.</p>
            <p style={{ margin: "0 0 8px" }}>On les reconnaît du premier coup d'œil : leur <b>vignette est grisée</b> et porte le bandeau « Fiche de référence ». Elles fonctionnent comme les autres — notes, avis, envies de découvrir, points de règle, chronomètre, parties enregistrées — à une exception près : elles ne sont <b>pas comptées dans les jeux de l'association</b>. Le titre de la ludothèque affiche donc les jeux réellement possédés, et mentionne à part le nombre de fiches de référence.</p>
            <p style={{ margin: "0 0 8px" }}><b>En créer une :</b> ajoutez un jeu comme d'habitude, puis à la question « Qui possède ce jeu ? » choisissez <b>« Personne — fiche de référence »</b>.</p>
            <p style={{ margin: "0 0 8px" }}><b>Elles vont et viennent toutes seules.</b> Si le dernier propriétaire d'un jeu clique sur « Je ne l'ai plus », la fiche n'est plus supprimée : elle bascule en fiche de référence. Les notes, avis, commentaires et parties déjà enregistrées sont <b>conservés</b> — des années d'historique ne disparaissent plus parce qu'un membre a revendu sa boîte. À l'inverse, dès qu'un membre clique sur <b>« Je l'ai ! »</b>, la fiche retrouve ses couleurs et rejoint la ludothèque de l'association.</p>
            <p style={{ margin: 0 }}>Le filtre <b>« Toute la ludothèque »</b> en haut de la page permet de n'afficher que les <b>jeux de l'association</b>, ou au contraire que les <b>fiches de référence</b>. Comme ces fiches n'appartiennent à personne, elles sont entretenues collectivement : <b>tout membre</b> peut en corriger les informations. Elles ne sont pas proposées dans les recommandations personnalisées — inutile de conseiller un jeu que personne n'a sous la main.</p>
          </>,
        },
        {
          q: "Les points de règle : la mémoire commune de la table",
          a: <>
            <p style={{ margin: "0 0 8px" }}>Sur chaque fiche de jeu, juste sous « Chronométrer une partie », un encadré <b style={{ color: C.teal }}>📖 Points de règle</b> rassemble les précisions tranchées par les membres : une règle mal rédigée, une variante qu'on a adoptée, un piège dans lequel tout le monde tombe. Plus besoin de refaire le débat à chaque partie.</p>
            <p style={{ margin: "0 0 8px" }}><b>Tout membre peut en ajouter</b> : ouvrez l'encadré, cliquez sur « Ajouter un point de règle », écrivez, validez. Les points s'affichent numérotés (1, 2, 3…) dans l'ordre où ils ont été écrits, avec le nom de leur auteur.</p>
            <p style={{ margin: "0 0 8px" }}>Chacun peut <b>modifier</b> (✏️) ou <b>supprimer</b> (🗑️) les points qu'il a écrits ; les administrateurs peuvent intervenir sur tous, pour corriger une coquille ou retirer un doublon.</p>
            <p style={{ margin: 0 }}>Et surtout : les points de règle sont aussi accessibles <b>depuis le chronomètre</b>, via le bouton 📖 en haut de l'écran — c'est justement en pleine partie que la question se pose. Consultation, ajout, correction et suppression y fonctionnent à l'identique, sans quitter la partie en cours.</p>
          </>,
        },
        {
          q: "La fiche d'un membre : ses jeux, son top 10, ses jeux les plus joués",
          a: <>
            <p style={{ margin: "0 0 8px" }}>Sur l'accueil, cliquez sur le <b>nombre de membres</b> pour ouvrir le trombinoscope, puis sur un membre pour voir sa fiche.</p>
            <p style={{ margin: "0 0 8px" }}>On y trouve sa présentation, ses badges, son <b>💎 top 10 ever</b> (les jeux qu'il garderait s'il ne restait qu'eux) et, juste en dessous, ses <b>🎲 jeux les plus joués</b> : le classement de ses 10 jeux les plus fréquents, avec le <b>nombre de parties</b> et ses victoires, calculé automatiquement à partir des parties enregistrées. Chaque ligne ouvre la fiche du jeu.</p>
            <p style={{ margin: 0 }}>Vient enfin sa ludothèque. Si le membre partage une <b>ludothèque familiale</b>, les deux sont désormais affichées : d'abord <b>ses jeux à lui</b> en grandes vignettes, puis les jeux <b>du reste du foyer</b> en petites vignettes. Avant, seule l'une des deux apparaissait.</p>
          </>,
        },
        {
          q: "Je ne possède plus un jeu : que devient sa fiche ?",
          a: <p style={{ margin: 0 }}>Sur la fiche du jeu, le bouton <b>« Je ne l'ai plus »</b> vous retire des propriétaires. S'il en reste d'autres, rien ne change pour eux. Si vous étiez le <b>dernier</b>, la fiche n'est plus supprimée : elle devient une <b>fiche de référence</b> (grisée, hors du compte des jeux de l'association), et tout l'historique est préservé — notes, avis, commentaires, parties, points de règle. Seuls les <b>administrateurs</b> peuvent supprimer définitivement une fiche.</p>,
        },
        {
          q: "Ajouter un jeu à ma ludothèque",
          a: <>
            <p style={{ margin: "0 0 8px" }}>Dans <b>Mon espace</b> ou la <b>Ludothèque</b> → « Ajouter un jeu ». Deux chemins : la recherche <b>BoardGameGeek</b> (la fiche arrive préremplie et traduite — vous pouvez tout retoucher avant validation : nom, image, prix, mécaniques…) ou la saisie manuelle.</p>
            <p style={{ margin: 0 }}>Vous pouvez déclarer que le jeu appartient à un autre membre (ou à plusieurs) : chacun devra confirmer depuis son espace. Le site signale les doublons probables au moment de la saisie.</p>
          </>,
        },
        {
          q: "Confirmer une possession déclarée par un autre membre",
          a: <>
            <p style={{ margin: "0 0 8px" }}>Quand quelqu'un déclare que vous possédez un jeu ou une extension, un encart « Possessions à confirmer » apparaît dans <b>Mon espace</b>. Tant que vous n'avez pas confirmé, le jeu ne compte pas dans votre ludothèque.</p>
            <Illu caption="L'encart de confirmation dans Mon espace.">
              <MockBtn color={C.teal}><Check size={14} /> Confirmer</MockBtn>
              <MockBtn color={C.red}><X size={14} /> Supprimer</MockBtn>
            </Illu>
          </>,
        },
        {
          q: "Les extensions",
          a: <>
            <p style={{ margin: "0 0 8px" }}>Une extension est un contenu qui <b>nécessite absolument le jeu de base</b> pour être joué (nouvelles cartes, plateaux, modules…). Si une boîte se joue seule, ce n'est pas une extension : entrez-la comme un <b>jeu</b> à part entière.</p>
            <p style={{ margin: 0 }}>Sur la fiche d'un jeu, la rubrique extensions permet d'en ajouter (recherche BGG ou saisie manuelle), de dire « Je l'ai », ou de <b>déclarer un autre propriétaire</b> — même circuit de confirmation que pour les jeux.</p>
          </>,
        },
        {
          q: "Les scores : les noter, les enregistrer, les retrouver",
          a: <>
            <p style={{ margin: "0 0 8px" }}>Pendant une partie chronométrée, chaque joueur a une <b>pastille de score</b> : touchez-la pour ouvrir le pavé de saisie. Les scores sont <b>partagés en direct</b> entre tous les téléphones de la tablée.</p>
            <p style={{ margin: "0 0 8px" }}>À la fin de la partie, si des points ont été saisis, le chrono demande <b>quel score l'emporte</b> : « le plus grand » ou « le plus petit ». Le <b>vainqueur est alors déduit automatiquement</b> — et vous pouvez toujours le corriger à la main, par exemple en cas d'égalité départagée autrement.</p>
            <p style={{ margin: "0 0 8px" }}>Ce réglage est <b>mémorisé sur la fiche du jeu</b> : la prochaine partie le retrouvera déjà pré-sélectionné. Le modifier depuis le chrono met la fiche à jour, et inversement — vous pouvez aussi le définir directement à la <b>création ou la modification d'une fiche de jeu</b> (« Sens du score »), y compris « Non applicable » pour un jeu coopératif.</p>
            <p style={{ margin: "0 0 8px" }}>Les scores sont <b>conservés</b>, y compris pour les parties enchaînées avec « Nouvelle partie ». On les retrouve ensuite en cliquant sur une partie : dans <b>Mon espace → Mes parties</b>, et sur la fiche du jeu via « Voir le détail des parties ». Le classement s'affiche avec le nom de chaque joueur, ses points et le trophée du vainqueur.</p>
            <p style={{ margin: 0 }}>Vous pouvez aussi noter les points d'une partie <b>jouée sans le chrono</b> : dans <b>« Enregistrer une partie jouée »</b>, une case «&nbsp;pts&nbsp;» est proposée à côté de chaque joueur. Elle est <b>facultative</b> — laissez-la vide si vous n'avez pas les scores. Dès qu'un point est saisi, le même choix «&nbsp;le plus grand / le plus petit&nbsp;» apparaît, le vainqueur se coche tout seul et le réglage est mémorisé sur la fiche du jeu.</p>
          </>,
        },
        {
          q: "Moyennes et records de points d'un jeu",
          a: <>
            <p style={{ margin: "0 0 8px" }}>Dès qu'au moins un score a été enregistré, un encart <b>« Les points »</b> apparaît sur la fiche du jeu. Il indique :</p>
            <ul style={{ margin: "0 0 8px", paddingLeft: 20, lineHeight: 1.75 }}>
              <li>la <b>moyenne des points d'une partie</b>, toutes parties et tous joueurs confondus ;</li>
              <li><b>votre moyenne personnelle</b>, dès que vous avez joué au moins une partie comptabilisée ;</li>
              <li>le <b>record</b> toutes parties confondues, avec le nom du joueur et la date — le plus haut score si le plus grand l'emporte, le plus bas dans le cas contraire ;</li>
              <li><b>votre record personnel</b>.</li>
            </ul>
            <p style={{ margin: 0 }}>Tant qu'aucune partie n'a de score enregistré, l'encart reste masqué. Les parties écartées par un administrateur et celles que vous avez retirées de votre historique ne comptent pas.</p>
          </>,
        },
        {
          q: "Tablée : jeux pour enfants et jeux « one shot »",
          a: <>
            <p style={{ margin: "0 0 8px" }}>Le composeur de tablée écarte automatiquement deux familles de jeux, avec une zone dédiée pour reprendre la main.</p>
            <p style={{ margin: "0 0 8px" }}><b>Les jeux pour enfants</b> (ceux qui portent la mécanique <b>« Enfants »</b>). Entre adultes, ils sont <b>masqués par défaut</b>. Trois boutons permettent de choisir : <b>« Masqués »</b>, <b>« Enfants + tous les autres »</b> pour les réintégrer aux propositions, ou <b>« Uniquement les jeux enfants »</b> pour n'afficher qu'eux.</p>
            <p style={{ margin: "0 0 8px" }}>Dès qu'un <b>compte enfant</b> (tétine) fait partie de la tablée, le réglage bascule tout seul sur <b>« Uniquement les jeux enfants »</b>, et le nom des enfants présents s'affiche. Vous restez libre d'élargir aux autres jeux, ou même de ne plus tenir compte des jeux pour enfants du tout.</p>
            <p style={{ margin: 0 }}><b>Les jeux « one shot »</b> — mécaniques <b>Enquête</b>, <b>Escape game</b> et <b>Legacy</b> — sont eux aussi <b>retirés par défaut</b> : une fois l'histoire connue, l'intérêt d'y rejouer retombe. Une case à cocher les fait réapparaître dans les trois sections de propositions.</p>
          </>,
        },
        {
          q: "Composer ma tablée (classement sur-mesure)",
          a: <>
            <p style={{ margin: "0 0 8px" }}>Sur la page <b>Ludothèque</b>, le bouton « Composer ma tablée » vous aide à trouver le bon jeu pour les personnes présentes. Sélectionnez les participants : les propositions sont automatiquement limitées aux jeux <b>jouables par toute la tablée</b> (vous pouvez toujours forcer un autre nombre de joueurs), la durée se filtre par <b>tranches</b> (entre 0 et 30 min, entre 31 min et 1 h… jusqu'à « 3 h et plus »), et <b>aucun jeu comportant une mécanique détestée</b> par un participant n'est proposé.</p>
            <p style={{ margin: 0 }}>Trois sections, affichées 15 jeux à la fois (« Afficher 15 jeux de plus » en bas de chacune) : <b>Envies de découverte</b> (les jeux que la tablée rêve d'essayer), <b>Mieux notés par la tablée</b> (à partir de 3 participants, un jeu doit être noté par au moins 2 d'entre eux) et <b>Exploration ludique</b> — des suggestions qui mélangent les mécaniques favorites des participants, leurs coups de coeur individuels et les goûts des membres au profil proche de la tablée.</p>
          </>,
        },
        {
          q: "Le top 10 ever des membres",
          a: <p style={{ margin: 0 }}>Dans <b>Mon espace</b>, juste au-dessus de votre ludothèque : composez votre <b>top 10 ever</b> — les 10 jeux que vous garderiez s'il n'y avait plus que ça à jouer sur Terre, dans l'ordre. Il s'affiche sur votre fiche de membre, et chaque jeu élu le mentionne fièrement sur sa fiche (« 💎 Dans le top 10 de Fabien (n°3) »). Modifiable à tout moment. Pour voir votre fiche telle que les autres la voient : bouton « Voir ma fiche » en haut de Mon espace.</p>,
        },
        {
          q: "Louer un jeu à un autre membre",
          a: <p style={{ margin: 0 }}>Les membres peuvent se louer des jeux entre eux (environ 10 % du prix neuf). Tout se passe dans la rubrique <b>Location</b> de la fiche du jeu ; vos prêts et emprunts en cours sont récapitulés dans <b>Mes locations</b>.</p>,
        },
      ],
    },
    {
      icon: "📅", title: "Les moments jeux",
      items: [
        {
          q: "Proposer un moment et comprendre le quorum",
          a: <>
            <p style={{ margin: "0 0 8px" }}>Page <b>Moments jeux</b> → « Proposer un moment jeux » (ou cliquez directement un jour libre du calendrier). Choisissez présentiel ou <b>en ligne sur Board Game Arena</b> — les jeux BGA sont gratuits pour tous grâce au compte premium de l'association.</p>
            <p style={{ margin: "0 0 8px" }}>Une case <b>« Moment jeux privé »</b> (décochée par défaut) permet de réserver le moment aux personnes que vous invitez — voir la question dédiée ci-dessous.</p>
            <p style={{ margin: 0 }}>Le <b>minimum de joueurs</b> définit le quorum : tant qu'il n'est pas atteint, le moment est « en attente ». Dès qu'il l'est, les inscrits reçoivent une notification — et une autre si on repasse en dessous. Si une <b>date limite de validation</b> a été fixée et qu'elle passe sans quorum, le moment devient <b>noir « annulé »</b> : plus aucune inscription ni action n'est possible, sauf pour son créateur ou un admin, qui peut prolonger le délai pour le réactiver.</p>
          </>,
        },
        {
          q: "Créer un moment jeux privé",
          a: <>
            <p style={{ margin: "0 0 8px" }}>À la création (ou à la modification) d'un moment jeux, cochez <b>« Moment jeux privé »</b>. Cette case est <b>décochée par défaut</b> et fonctionne aussi bien pour un moment <b>en présentiel</b> que <b>en ligne sur BGA</b>.</p>
            <p style={{ margin: "0 0 8px" }}>Un moment privé n'est visible que par les <b>membres conviés</b> : son créateur, les inscrits, et les invités que vous ajoutez. Il <b>n'apparaît pas</b> dans le calendrier des autres membres, ni sur la page d'accueil, ni dans le <b>flux d'abonnement iCal</b>.</p>
            <p style={{ margin: "0 0 8px" }}>Les <b>administrateurs du site</b> le voient malgré tout, <b>en grisé</b> dans le calendrier, et peuvent interagir avec lui comme avec n'importe quel autre moment (modération). Un cadenas 🔒 signale les moments privés.</p>
            <p style={{ margin: "0 0 8px" }}>Pensez à <b>ajouter vos invités</b> dès la création : sans invité, vous seriez seul à voir votre moment. Le partage sur Signal n'est logiquement pas proposé après la création d'un moment privé.</p>
            <p style={{ margin: 0 }}>À noter : les <b>comptes enfants</b> (tétine) peuvent participer aux moments jeux <b>privés</b> auxquels ils sont conviés — c'est justement le cadre prévu pour eux avant {CHILD_AGE_LIMIT} ans.</p>
          </>,
        },
        {
          q: "Jusqu'à quand peut-on s'inscrire à un moment jeux ?",
          a: <>
            <p style={{ margin: "0 0 8px" }}>Deux verrous encadrent les inscriptions. Le plus proche l'emporte, et la fiche du moment affiche toujours la date retenue.</p>
            <ul style={{ margin: "0 0 8px", paddingLeft: 20, lineHeight: 1.75 }}>
              <li><b>La limite d'inscription</b> (facultative) : à la création du moment, une case <b style={{ color: C.teal }}>« Fixer une limite d'inscription »</b> permet de choisir une date et une heure au-delà desquelles plus personne ne peut s'inscrire ni être invité. De quoi motiver tout le monde à se décider sans attendre la dernière minute. Le créateur peut la reculer à tout moment en modifiant le moment.</li>
              <li><b>Le verrou des {SIGNUP_LOCK_HOURS} h</b> (automatique, toujours actif) : <b>{SIGNUP_LOCK_HOURS} heures après le début du moment</b>, plus aucun participant ni invité ne peut être ajouté. Cela laisse une marge confortable pour régulariser après coup quelqu'un qui était bien là, puis fige définitivement la liste.</li>
            </ul>
            <p style={{ margin: "0 0 8px" }}>Quand c'est fermé, le bouton devient <b>« Inscriptions closes »</b> et « Ajouter un invité » disparaît. À noter : on peut <b>toujours se retirer</b> d'un moment, même après la fermeture — seuls les <i>ajouts</i> sont bloqués.</p>
            <p style={{ margin: 0 }}>Les <b>administrateurs</b> restent libres d'ajouter quelqu'un après la fermeture, pour corriger un oubli.</p>
          </>,
        },
        {
          q: "Être prévenu quand quelqu'un rejoint un moment",
          a: <p style={{ margin: 0 }}>Quand le <b>quorum est déjà atteint</b> et qu'un nouveau joueur s'inscrit, <b>tous les membres déjà inscrits</b> reçoivent une notification (« Untel vient de s'inscrire au moment jeux du … ») avec le nouveau total de participants. Pratique pour savoir si la tablée grossit et adapter les jeux qu'on apporte. Le franchissement du quorum, lui, garde sa propre notification.</p>,
        },
        {
          q: "Retirer un participant d'un moment jeux",
          a: <>
            <p style={{ margin: "0 0 8px" }}>Dans la fiche du moment, une petite croix apparaît à côté du nom des participants que vous avez le droit de retirer. Trois profils peuvent le faire :</p>
            <ul style={{ margin: "0 0 8px", paddingLeft: 20, lineHeight: 1.75 }}>
              <li>le <b>créateur du moment jeux</b>, pour n'importe quel participant ;</li>
              <li>le <b>participant lui-même</b> (équivalent du bouton « Me retirer ») ;</li>
              <li>un <b>administrateur</b> du site.</li>
            </ul>
            <p style={{ margin: 0 }}>Une confirmation est toujours demandée. Le membre retiré par quelqu'un d'autre en est <b>informé par une notification</b> et peut se réinscrire librement s'il le souhaite. Pour les <b>invités</b> (non-membres ou invitations en attente), le retrait reste réservé à celui qui les a ajoutés, au créateur et aux administrateurs.</p>
          </>,
        },
        {
          q: "Lire le calendrier",
          a: <>
            <Illu caption="La légende du calendrier — et le jour actuel, entouré de bleu nuit.">
              <span style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", justifyContent: "center" }}>
                <Legend color={C.teal} label="Présentiel — confirmé" /><Legend color={C.red} label="Présentiel — en attente" /><Legend color={C.purple} label="En ligne — confirmé" /><Legend color={C.amber} label="En ligne — en attente" /><Legend color="#2B2B2B" label="Annulé — quorum non atteint" /><Legend color="#9A8F7E" label="Privé — vue administrateur" /><Legend color={C.navy} label="Aujourd'hui" outline />
              </span>
            </Illu>
            <p style={{ margin: "6px 0 0" }}>Un clic sur un jour avec un moment ouvre sa fiche ; un clic sur un jour libre propose d'en créer un.</p>
            <p style={{ margin: "6px 0 0" }}>Un 🎂 signale l'anniversaire d'un membre. <b>Cliquez sur ce jour</b> pour savoir de qui il s'agit : la fenêtre donne le nom, la photo et l'âge fêté, et un clic sur la personne ouvre sa fiche. Pratique pour souhaiter un anniversaire qui ne tombe pas un jour de moment jeux — et si l'envie vous prend, un bouton propose d'organiser quelque chose ce jour-là. Quand un moment existe déjà à cette date, sa fiche le rappelle fièrement.</p>
            <p style={{ margin: "6px 0 0" }}>L'anniversaire apparaît aussi sur la <b>fiche de chaque membre</b>, sous son nom, avec son âge si l'année est renseignée. Il passe en ambre quand il approche (moins de 30 jours).</p>
          </>,
        },
        {
          q: "S'inscrire, inviter, et voir les couleurs préférées de chacun",
          a: <p style={{ margin: 0 }}>Sur la fiche d'un moment : « J'y serai ! » pour s'inscrire, et « Ajouter un invité » pour un proche ou un membre (le membre invité doit confirmer). À côté du nom de chaque inscrit, ses pastilles de couleurs préférées — un coup d'œil et la distribution des pions est réglée.</p>,
        },
        {
          q: "Déclarer les jeux joués (et le nombre de parties)",
          a: <>
            <p style={{ margin: "0 0 8px" }}>Pendant ou après un moment, les participants ajoutent les <b>jeux joués</b> sur sa fiche. Si un jeu a été joué plusieurs fois, montez son compteur :</p>
            <Illu caption="Le compteur de parties d'un jeu joué — ici, 3 parties de Catan dans la soirée.">
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ width: 24, height: 24, borderRadius: 7, border: "1.5px solid #d9cdb6", background: "#fff", color: C.navy, display: "grid", placeItems: "center", fontSize: 15 }}>−</span>
                <span style={{ minWidth: 20, textAlign: "center", fontFamily: "'Fredoka',sans-serif", fontWeight: 700, fontSize: 14, color: C.navy }}>3</span>
                <span style={{ width: 24, height: 24, borderRadius: 7, border: "1.5px solid #d9cdb6", background: "#fff", color: C.navy, display: "grid", placeItems: "center", fontSize: 15 }}>+</span>
              </span>
            </Illu>
            <p style={{ margin: "6px 0 8px" }}>Chaque participant recevra ensuite une suggestion par partie (« Catan — partie 2/3 ») à confirmer dans son espace.</p>
            <p style={{ margin: 0 }}><b>Qui peut modifier cette liste ?</b> <b>Tous les membres présents au moment</b> (les inscrits et le créateur), ainsi que les <b>administrateurs</b> — et personne d'autre. Chacun peut ajouter un jeu, changer son nombre de parties ou le retirer, sans avoir à être celui qui l'a ajouté : c'est la mémoire commune de la soirée, on la tient à plusieurs.</p>
          </>,
        },
        {
          q: "Recevoir les moments dans mon agenda personnel",
          a: <p style={{ margin: 0 }}>Sous la légende du calendrier, <b style={{ color: C.teal }}>« S'abonner au calendrier »</b> donne un lien à ajouter dans Google Agenda ou le Calendrier iPhone. Les soirées apparaissent ensuite toutes seules dans votre agenda (les moments en attente de quorum y figurent comme « provisoires »), et se mettent à jour automatiquement.</p>,
        },
      ],
    },
    {
      icon: "🏆", title: "Parties, victoires et badges",
      items: [
        {
          q: "Enregistrer une partie jouée",
          a: <p style={{ margin: 0 }}>Dans <b>Mon espace</b> → « 🎲 Enregistrer une partie jouée » : tapez le nom du jeu pour le retrouver, choisissez la date, les membres et invités présents, et cochez le trophée des vainqueurs. Vous êtes <b>ajouté d'office</b> comme participant — la petite croix vous retire si vous notez la partie pour d'autres. Les autres membres impliqués reçoivent une notification et devront <b>confirmer</b> leur participation — c'est leur propre déclaration de victoire qui compte, et refuser n'affecte en rien la partie des autres joueurs.</p>,
        },
        {
          q: "Confirmer les parties qui me concernent",
          a: <>
            <p style={{ margin: "0 0 8px" }}>L'encart <b>« Parties à confirmer »</b> de Mon espace regroupe les parties des soirées où vous étiez inscrit et les parties manuelles enregistrées par d'autres. Cochez « j'ai gagné » si c'est le cas, puis :</p>
            <Illu caption="Tant que vous n'avez pas confirmé, la partie ne compte pas dans vos statistiques.">
              <label style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 13, color: "#6b5d49" }}><input type="checkbox" readOnly checked /> j'ai gagné</label>
              <MockBtn color={C.teal}>J'y ai joué</MockBtn>
              <MockBtn color="#8a7c6a" soft>Non</MockBtn>
            </Illu>
          </>,
        },
        {
          q: "J'ai oublié de me déclarer vainqueur !",
          a: <p style={{ margin: 0 }}>Dans Mon espace → <b>Mes parties</b>, ouvrez « Voir toute la sélection » puis cliquez sur le jeu concerné : chaque partie porte un bouton <b>🏆 Vainqueur ?</b> — un clic vous déclare gagnant (ou vous retire si vous l'étiez). La corbeille <Trash2 size={13} style={{ verticalAlign: "-2px", color: C.red }} /> retire la partie de <b>votre</b> historique uniquement — les autres joueurs de la partie ne sont jamais affectés. Vos statistiques et le champion en titre se mettent à jour aussitôt.</p>,
        },
        {
          q: "C'est quoi, le badge doré sur certains jeux ?",
          a: <>
            <p style={{ margin: "0 0 8px" }}>C'est le <b>champion en titre</b> : le ou les vainqueurs de la toute dernière partie de ce jeu. Il passe de main en main à chaque nouvelle partie enregistrée !</p>
            <Illu caption="La ceinture de champion, sur la carte du jeu et sur sa fiche.">
              <ChampionBelt belt={{ playedAt: new Date().toISOString(), winners: [{ name: "Léa", userId: null, avatar: null }] }} size={64} />
            </Illu>
          </>,
        },
        {
          q: "Comment fonctionnent les badges ?",
          a: <>
            <p style={{ margin: "0 0 8px" }}>Douze badges récompensent votre vie ludique (parties, victoires, séries, découvertes, moments, possessions, notes…). Chacun a <b>8 paliers</b> : Novice, Apprenti, Aventurier, Champion, Héros, Maître, Légende… et Divinité. Le palier le plus haut atteint remplace le précédent.</p>
            <Illu caption="Cliquez un badge dans Mon espace pour voir tous ses paliers — et mettez vos 3 préférés en vitrine : ils s'afficheront à côté de votre nom.">
              <BadgeMedal def={BADGE_DEFS[0]} tier={3} size={58} />
              <BadgeMedal def={BADGE_DEFS[1]} tier={5} size={58} />
              <BadgeMedal def={BADGE_DEFS[8]} tier={2} size={58} />
            </Illu>
          </>,
        },
        {
          q: "Confirmer une partie enregistrée par quelqu'un d'autre",
          a: <p style={{ margin: 0 }}>Quand un membre enregistre une partie où vous figurez, elle apparaît dans <b>Mon espace</b> → <b>Parties à confirmer</b>. La case <b>« j'ai gagné »</b> arrive <b>déjà cochée</b> si celui qui a saisi la partie vous a déclaré vainqueur — la mention « vous êtes déclaré vainqueur » et votre score le rappellent sous le nom du jeu. Vous restez libre de la décocher (ou de la cocher) avant de valider : c'est votre confirmation qui fait foi. Auparavant la case était toujours vide, et beaucoup de victoires se perdaient au moment de confirmer.</p>,
        },
        {
          q: "Enchaîner plusieurs parties d'affilée",
          a: <p style={{ margin: 0 }}>Après avoir enregistré une partie, la fenêtre ne se referme plus tout de suite : elle propose de <b>repartir avec les mêmes joueurs</b>. Deux raccourcis — <b>une autre partie du même jeu</b>, ou <b>mêmes joueurs mais autre jeu</b>. Les équipes sont conservées, seuls les scores et les trophées repartent à zéro, et tout reste modifiable ensuite. Un compteur discret indique combien de parties vous avez enregistrées dans la foulée. Sinon, « Terminé pour aujourd'hui » referme la fenêtre.</p>,
        },
        {
          q: "Mes invités réguliers : les enregistrer une fois pour toutes",
          a: <>
            <p style={{ margin: "0 0 8px" }}>Vous jouez souvent avec les mêmes amis, qui ne sont pas membres du site ? Plutôt que de retaper leur prénom à chaque partie, gardez-les dans le <b>carnet d'invités</b> de votre foyer.</p>
            <p style={{ margin: "0 0 8px" }}><b>Pour en ajouter un</b>, trois chemins : depuis <b>Mon espace → Ma famille → Nos invités réguliers</b> ; à la fin d'un enregistrement de partie, en cliquant sur « Garder [prénom] » ; ou dans le chronomètre, via le lien « garder [prénom] » sous la saisie. C'est toujours un <b>geste volontaire</b> : rien ne s'enregistre tout seul.</p>
            <p style={{ margin: "0 0 8px" }}>Ils apparaissent ensuite sous <b>« Mes invités »</b>, en pastilles cliquables, au moment d'enregistrer une partie comme au lancement d'un chronomètre. Un clic, et ils sont à table.</p>
            <p style={{ margin: "0 0 8px" }}>Le carnet est <b>commun à toute la famille</b> : si vous partagez un foyer, vous voyez les invités des uns et des autres, et chacun peut les renommer ou les retirer depuis « Ma famille ». Seul le carnet de la personne qui lance la partie est proposé — chaque foyer garde le sien, et deux « Jean » dans deux familles différentes ne se mélangent pas.</p>
            <p style={{ margin: 0, fontSize: 13, color: "#8a7c6a" }}>Ce ne sont que des prénoms, un simple raccourci de saisie : aucune statistique, aucun classement, aucun historique ne leur est rattaché. Retirer un invité du carnet ne change rien aux parties déjà enregistrées. Pour qu'un ami ait vraiment ses statistiques, le mieux reste qu'il devienne membre du site.</p>
          </>,
        },
        {
          q: "« À venir » : sorties, hype et intentions d'achat",
          a: <>
            <p style={{ margin: "0 0 8px" }}>Chaque fiche peut porter une <b>date de sortie en France</b>. Selon le cas, une pastille apparaît sur la vignette comme sur la fiche :</p>
            <ul style={{ margin: "0 0 8px", paddingLeft: 20, lineHeight: 1.75 }}>
              <li><b style={{ color: C.amber }}>📅 Compte à rebours</b> quand la sortie approche (« dans 12 jours »), puis la date complète si elle est lointaine.</li>
              <li><b style={{ color: C.teal }}>✓ Jeu disponible</b> dès que la date est passée, ou si la case <b>« déjà sorti »</b> est cochée — pratique quand on ne connaît pas la date exacte.</li>
              <li><b style={{ color: C.purple }}>🌐 Sorti en VO</b> pour un jeu disponible à l'étranger mais pas encore traduit, tant qu'aucune date française n'est annoncée.</li>
            </ul>
            <p style={{ margin: "0 0 8px" }}>Le <b>classement par défaut</b> suit cette logique : d'abord les sorties à venir (la plus proche en tête), puis les jeux déjà disponibles, puis les VO. La <b>hype</b> reste accessible dans le menu de tri, aux côtés d'un classement par <b>intention d'achat</b> : chaque réponse vaut des points — précommandé 8, à la sortie 6, certainement 4, en promotion 3, pour compléter une commande 2, peu probable 1, jamais 0 — et <b>chaque membre qui possède déjà le jeu vaut 10 points</b>. Les fiches les plus convoitées remontent ainsi d'elles-mêmes.</p>
            <p style={{ margin: 0 }}>Enfin, deux encarts se repèrent d'un coup d'œil : <b style={{ color: C.teal }}>📦 déjà dans leur ludothèque</b> (lu directement dans la ludothèque de l'association : rien à déclarer, le bouton « Je l'ai ! » suffit — et vous savez à qui l'emprunter) et <b style={{ color: "#8a6a1f" }}>🎯 intéressés par l'achat</b> (tous sauf « peu probable » et « jamais »), de quoi grouper une commande. Les compteurs figurent aussi sur les vignettes.</p>
          </>,
        },
        {
          q: "Réagir à un commentaire",
          a: <>
            <p style={{ margin: "0 0 8px" }}>Sous chaque commentaire du site — fiches de jeux, moments jeux, idées et votes de l'espace décisionnaire — quatre réactions sont proposées : <b>❤️ j'adore</b>, <b>👍 d'accord</b>, <b>👎 pas d'accord</b> et <b>💔 ça me fend le cœur</b>.</p>
            <p style={{ margin: "0 0 8px" }}>Une seule réaction par personne et par commentaire : en choisir une autre remplace la précédente, et recliquer sur la même la retire. Le compteur à côté de chaque symbole indique combien de membres l'ont choisi.</p>
            <p style={{ margin: 0 }}>Le lien <b>« qui ? »</b> déplie la liste des personnes ayant réagi, classées par symbole. Rien n'est anonyme ici, contrairement aux votes de l'espace décisionnaire : c'est une conversation, pas un scrutin.</p>
          </>,
        },
        {
          q: "Retirer une partie de mon historique",
          a: <p style={{ margin: 0 }}>Dans <b>Mon espace</b> → <b>🎲 Mes parties</b>, ouvrez un jeu puis la corbeille à côté d'une partie : elle quitte votre historique et vos statistiques (les autres joueurs ne sont pas affectés). Le site <b>retient votre décision</b> : la partie ne reviendra plus vous demander « as-tu joué à ce jeu ? » dans « Parties à confirmer ». Auparavant, une partie retirée à la main réapparaîssait aussitôt en suggestion — ce n'est plus le cas.</p>,
        },
        {
          q: "« Mes parties » : ouvrir la fiche d'un jeu",
          a: <p style={{ margin: 0 }}>Dans <b>Mon espace</b> → <b>🎲 Mes parties</b>, cliquez sur un jeu du classement pour voir le détail de vos parties sur la période. Dans cet affichage, le <b>nom du jeu en haut de la fenêtre</b> est souligné : un clic ouvre directement sa <b>fiche complète</b> (note, avis, extensions, propriétaires, chronomètre…). Fermez la fiche pour revenir à vos parties.</p>,
        },
        {
          q: "La rétrospective : votre bilan ludique",
          a: <p style={{ margin: 0 }}>Dans <b>Mon espace</b>, la bannière « 🎁 Ma rétrospective » dresse votre bilan du mois ou de l'année : parties, victoires, jeu fétiche, heures de jeu — et pour l'année, partenaire favori, découvertes, meilleure série et badges. Chaque début de mois, la version du mois écoulé arrive aussi <b>par e-mail</b> (et le grand bilan annuel en janvier) — désactivable dans les réglages de Mon espace.</p>,
        },
      ],
    },
    {
      icon: "⏱️", title: "Le chronomètre",
      items: [
        {
          q: "Lancer un chrono",
          a: <>
            <p style={{ margin: "0 0 8px" }}>Deux portes d'entrée : la fiche d'un jeu (« <b>Chronométrer une partie</b> ») ou la fiche d'un moment (« <b>Lancer le chrono de la partie</b> » — la partie sera alors rattachée à la soirée). Ajoutez les joueurs — membres ou invités — et c'est parti.</p>
            <p style={{ margin: "0 0 8px" }}>Depuis un <b>moment jeux</b>, tous les participants du moment (inscrits, membres invités et invités non-membres) sont <b>pré-ajoutés d'office</b> à la partie. Il ne reste plus qu'à retirer ceux qui ne sont pas à cette table-là, d'une croix, avant de démarrer.</p>
            <p style={{ margin: 0 }}><b>Rejoindre au lieu d'en lancer un deuxième.</b> Si un chrono tourne déjà sur ce moment, il apparaît en haut de la fiche du moment sous « Chrono en cours », avec le jeu, qui l'a lancé et combien de joueurs y sont — un bouton <b>Rejoindre</b> vous y emmène directement. Le rappel s'affiche aussi sur l'écran de préparation, au cas où vous seriez déjà parti pour en créer un. Plus besoin de se passer le code de bouche à oreille autour de la table.</p>
            <p style={{ margin: "8px 0 0" }}><b>Les « jeux joués » du moment se remplissent tout seuls.</b> Le jeu choisi dans le chrono s'ajoute immédiatement à la fiche du moment, et chaque <b>manche supplémentaire</b> relève son compteur de parties. Plus rien à ressaisir après coup — et pas de doublon : les demandes de confirmation envoyées aux participants tiennent compte de ce que le chrono a déjà enregistré. Si vous aviez relevé le compteur à la main pour des parties non chronométrées, votre chiffre est conservé : le chrono ne le fait jamais redescendre.</p>
          </>,
        },
        {
          q: "Retrouver les points de règle en pleine partie",
          a: <p style={{ margin: 0 }}>Le bouton <b style={{ color: C.teal }}>📖 Règles</b>, en haut de l'écran du chrono, ouvre les <b>points de règle</b> du jeu en cours — les mêmes que sur sa fiche. Le chiffre entre parenthèses indique combien il y en a. Vous pouvez y <b>ajouter</b> une précision à chaud, <b>corriger</b> ou <b>supprimer</b> les vôtres, puis refermer et reprendre la partie là où vous en étiez. Tout ce qui est écrit ici apparaît immédiatement sur la fiche du jeu, pour tous les membres.</p>,
        },
        {
          q: "Enchaîner un autre jeu sans quitter le chrono",
          a: <>
            <p style={{ margin: "0 0 8px" }}>C'est la façon de faire quand une tablette reste posée au milieu de la table toute la soirée. À la fin d'une partie, l'hôte dispose de trois sorties : <b>Fermer sans enregistrer</b>, <b>Enregistrer et quitter</b>, ou <b>🎲 Enregistrer et enchaîner un autre jeu</b>.</p>
            <p style={{ margin: "0 0 8px" }}>La troisième enregistre le résultat, puis ouvre la liste des jeux — ceux du moment jeux d'abord, puis toute la ludothèque par recherche. Un clic, et un nouveau chrono démarre avec <b>les mêmes joueurs, les mêmes équipes et les mêmes couleurs</b>. Plus rien à ressaisir.</p>
            <p style={{ margin: "0 0 8px" }}>Et surtout : <b>tous les téléphones déjà connectés basculent tout seuls</b> sur le nouveau jeu. Personne n'a à rescanner un code ni à relancer quoi que ce soit — l'écran de chacun suit l'hôte. Vous repassez par l'écran de préparation, avec la tablée précédente déjà en place : c'est là qu'on retire celui qui rentre et qu'on ajoute celui qui arrive.</p>
            <p style={{ margin: 0 }}><b>🔄 Changer de jeu en cours de route.</b> La boîte est ouverte, les règles expliquées, et finalement la tablée part sur autre chose ? Le bouton <b>« Changer de jeu »</b> remplace le jeu de la partie en cours sans rien perturber : mêmes joueurs, mêmes équipes, mêmes couleurs, et les chronos continuent de tourner — le temps de mise en place déjà passé reste compté. C'est possible tant qu'<b>aucune manche n'a été enregistrée</b> ; au-delà, utilisez plutôt « terminer et enchaîner », pour que chaque jeu garde sa propre partie et ses propres temps.</p>
          </>,
        },
        {
          q: "Jouer en équipes",
          a: <>
            <p style={{ margin: "0 0 8px" }}>Dans le chrono, le bouton <b>👥 Mode équipe</b> ouvre la composition des équipes : chaque joueur reçoit une lettre (Équipe A, B, C…) ou reste sur <b>Seul</b> s'il joue pour lui-même.</p>
            <p style={{ margin: "0 0 8px" }}>Dès lors, le <b>score saisi pour un joueur est reporté à l'identique sur ses coéquipiers</b> — c'est bien le même score, pas une addition : une équipe marque ses points ensemble. Un joueur qui rejoint une équipe en cours de partie hérite aussitôt du score de celle-ci. Les coéquipiers partagent aussi la <b>même couleur</b> à l'écran.</p>
            <p style={{ margin: 0 }}>Même chose pour une partie <b>non chronométrée</b> : dans « Enregistrer une partie », cochez <b>Partie en équipes</b> et attribuez les lettres. Le pavé de score rappelle l'équipe concernée, et le trophée reste à cocher joueur par joueur.</p>
          </>,
        },
        {
          q: "Les couleurs des joueurs",
          a: <>
            <p style={{ margin: "0 0 8px" }}>Chaque joueur reçoit automatiquement une couleur, dans cet ordre : sa <b>couleur préférée</b> renseignée sur son profil, puis sa deuxième, puis sa troisième si les précédentes sont déjà prises — et à défaut la première couleur libre de la palette. Le premier arrivé garde la sienne.</p>
            <p style={{ margin: 0 }}>Vous pouvez toujours <b>changer une couleur à la main</b> : touchez la pastille colorée sur la carte du joueur pour ouvrir le nuancier. Les couleurs déjà prises par quelqu'un d'autre y sont signalées d'un point blanc, et un bouton permet de revenir à l'attribution automatique. Le choix vaut pour cette partie et se voit sur tous les appareils.</p>
          </>,
        },
        {
          q: "Rejoindre une partie en scannant un QR code",
          a: <>
            <p style={{ margin: "0 0 8px" }}>Dès qu'un chrono est lancé, un <b>QR code</b> s'affiche à côté du code à six caractères. Chacun le scanne avec <b>l'appareil photo de son téléphone</b> — aucune application à installer — et arrive directement dans la partie, sans rien saisir.</p>
            <p style={{ margin: "0 0 8px" }}>En <b>vue tablette</b>, le code affiché dans le bandeau du jeu est cliquable : il ouvre un grand QR au centre de l'écran, lisible depuis l'autre bout de la table. Pratique quand un joueur arrive en cours de soirée.</p>
            <p style={{ margin: 0, fontSize: 13, color: "#8a7c6a" }}>Le QR est fabriqué par le site lui-même, sans passer par aucun service extérieur : le code de votre partie ne quitte jamais votre navigateur.</p>
          </>,
        },
        {
          q: "Le mode tablette (écran en paysage)",
          a: <>
            <p style={{ margin: "0 0 8px" }}>Sur un <b>grand écran en paysage</b> — typiquement un iPad posé au milieu de la table — le chrono bascule tout seul sur une <b>disposition dédiée</b>, pensée pour être lue à un mètre de distance.</p>
            <ul style={{ margin: "0 0 8px", paddingLeft: 20, lineHeight: 1.75 }}>
              <li>En haut, les <b>trois grands blocs</b> de phase : mise en place, partie, rangement, avec leur chrono en très gros.</li>
              <li>En dessous, le <b>jeu en cours</b> avec sa miniature, le numéro de manche et la durée de jeu.</li>
              <li>Puis les <b>cartes joueurs</b>, une par ligne : à gauche la photo et le nom (avec l'équipe s'il y en a une), au centre le <b>score en très grand</b> — touchez-le pour le modifier — et à droite le <b>temps de jeu</b>. Le joueur dont c'est le tour voit sa carte s'allumer entièrement dans sa couleur ; les autres gardent une bande colorée sur le bord. Les tailles s'adaptent à la dalle : plus l'écran est grand, plus les chiffres le sont.</li>
              <li>En bas, les <b>gros boutons</b> : mode équipe, écran allumé, points de règle, et les commandes de l'hôte (pause, manche suivante, tous en même temps, terminer).</li>
            </ul>
            <p style={{ margin: 0 }}>Un bouton <b>📱 Vue téléphone</b> / <b>🖥️ Vue tablette</b> en haut à droite permet de forcer l'une ou l'autre disposition si le choix automatique ne vous convient pas.</p>
          </>,
        },
        {
          q: "Retirer un joueur, corriger les temps",
          a: <>
            <p style={{ margin: "0 0 8px" }}><b>👥 La tablée.</b> Ce bouton rassemble tout ce qui touche aux joueurs : les équipes, mais aussi les <b>arrivées</b> et les <b>départs</b> en cours de partie. Quelqu'un s'installe ? Ajoutez-le depuis vos invités enregistrés, par son nom, ou choisissez un membre — il démarre à zéro point et sans temps de jeu, sans fausser les compteurs des autres. Quelqu'un s'en va, ou s'était ajouté par erreur ? La <b>croix rouge</b> le retire ; son temps de jeu et son score partent avec lui, puisqu'il n'a pas joué. Le dernier joueur ne peut pas être retiré, et si c'était son tour, la partie se met simplement en pause. La croix est aussi disponible directement sur les cartes des joueurs.</p>
            <p style={{ margin: "0 0 8px" }}><b>⏱️ Corriger les temps.</b> L'oubli classique : on lance la partie sans arrêter le chrono de mise en place. Le bouton <b>« Corriger les temps »</b> ouvre les trois compteurs et permet de <b>reporter</b> du temps d'une phase vers une autre en un geste — « Mise en place → Partie », par exemple, avec le nombre de minutes de votre choix. Vous pouvez aussi saisir directement les valeurs.</p>
            <p style={{ margin: 0 }}>La correction fonctionne même pendant qu'une phase tourne : elle s'applique au temps déjà compté, et les secondes qui défilent viennent s'y ajouter normalement.</p>
          </>,
        },
        {
          q: "Garder l'écran allumé pendant la partie",
          a: <>
            <p style={{ margin: "0 0 8px" }}>Pendant une partie, un bouton <b style={{ color: "#8a6a1f" }}>☀️ Écran allumé</b> apparaît en haut du chrono. Tant qu'il est actif, le téléphone <b>ne se met plus en veille tout seul</b> : le chrono reste sous les yeux de toute la tablée. Un second appui rend la main à la veille automatique (🌙).</p>
            <p style={{ margin: "0 0 8px" }}>C'est actif par défaut dès que la partie démarre, et relâché tout seul à la fin — inutile de vider la batterie sur l'écran de résultats.</p>
            <p style={{ margin: 0, fontSize: 13, color: "#8a7c6a" }}>À savoir : afficher le chrono <i>sur l'écran verrouillé</i> n'est pas possible depuis un site web — cela demanderait une vraie application installée. Empêcher la veille est l'équivalent le plus proche. La fonction demande un navigateur récent (Chrome Android, Safari iOS 16.4+) ; si votre appareil ne la propose pas, le bouton n'apparaît tout simplement pas.</p>
          </>,
        },
        {
          q: "Jouer à plusieurs téléphones",
          a: <p style={{ margin: 0 }}>Chaque partie a un <b>code</b> affiché à l'écran : les autres joueurs le saisissent dans le champ « code » de la page d'accueil (ou via le lien partagé) pour rejoindre depuis leur propre téléphone et suivre leur temps eux-mêmes. Tout le monde voit les mêmes chronos, en direct.</p>,
        },
        {
          q: "Compter les points pendant la partie",
          a: <p style={{ margin: 0 }}>Fini le papier-crayon : sur la ligne de chaque joueur, une pastille <b>score</b> (à 0 au départ) ouvre un clavier type calculatrice. Saisissez directement le score puis validez avec le <b>bouton vert</b>, ou appuyez d'abord sur <b>+</b> ou <b>−</b> pour ajouter ou retrancher des points au score en cours. Les scores sont partagés en direct entre tous les téléphones et repartent à zéro à chaque « Nouvelle partie ».</p>,
        },
        {
          q: "Les trois phases : mise en place, jeu, rangement",
          a: <>
            <p style={{ margin: "0 0 8px" }}>Le chrono distingue trois temps, pour des statistiques honnêtes :</p>
            <Illu caption="On bascule d'une phase à l'autre d'un appui ; « Pause » suspend tout (l'arrivée de la pizza, par exemple).">
              <MockBtn color={C.teal}>Mise en place & explications</MockBtn>
              <MockBtn color={C.navy}>Jeu</MockBtn>
              <MockBtn color={C.purple}>Rangement</MockBtn>
            </Illu>
            <p style={{ margin: "6px 0 0" }}>Pendant le jeu, le gros bouton <b>« C'est mon tour »</b> permet à chacun de prendre la main pour compter son temps de réflexion — ou laissez tourner en mode simultané.</p>
          </>,
        },
        {
          q: "Enchaîner plusieurs parties du même jeu",
          a: <p style={{ margin: 0 }}>Le bouton <b>« Nouvelle partie »</b> clôt la manche en cours : vous déclarez son ou ses vainqueurs, le chrono de jeu et les temps de chaque joueur repartent à zéro, et la mise en place comme le rangement (communs) sont conservés — ils seront répartis équitablement entre les parties dans les statistiques de durée.</p>,
        },
        {
          q: "Terminer… ou quitter sans enregistrer",
          a: <p style={{ margin: 0 }}><b>« Terminer »</b> passe à l'écran de fin : cochez les vainqueurs (laissez vide pour un jeu coopératif) et enregistrez — la partie alimente les statistiques, le champion en titre et vos badges. <b>« Quitter sans enregistrer »</b> abandonne tout : aucune durée, aucun résultat, la session est supprimée.</p>,
        },
        {
          q: "Pas de doublon : un joueur, une ligne — une partie, un enregistrement",
          a: <>
            <p style={{ margin: "0 0 8px" }}><b>Le même membre n'apparaît plus deux fois.</b> Si l'organisateur vous a déjà ajouté à la partie et que vous la rejoignez ensuite depuis votre téléphone, le chrono <b>reconnaît votre ligne</b> et vous la rend, au lieu d'en créer une seconde à votre nom.</p>
            <p style={{ margin: "0 0 8px" }}><b>Une partie jouée = un enregistrement.</b> Quand un jeu est à la fois déclaré dans les « jeux joués » d'un moment et chronométré, les deux ne se cumulent plus : <b>c'est le chrono qui fait foi</b> (il a les durées et les scores) et la partie déclarée à la main qu'il recouvre est absorbée.</p>
            <p style={{ margin: 0 }}>Les vrais multiples restent bien comptés : si vous annoncez <b>3 parties</b> d'un jeu dans la soirée et n'en chronométrez qu'une, vous obtenez bien <b>3 enregistrements</b> — un chronométré et deux déclarés. Deux chronos successifs du même jeu comptent également pour deux parties. Un jeu chronométré depuis un moment s'ajoute par ailleurs tout seul à ses « jeux joués », pour que les autres participants reçoivent leur demande de confirmation.</p>
          </>,
        },
      ],
    },
    {
      icon: "👑", title: "L'espace décisionnaire",
      items: [
        {
          q: "À quoi sert l'onglet « Décisionnaire » ?",
          a: <>
            <p style={{ margin: "0 0 8px" }}>C'est un onglet <b>réservé aux membres décisionnaires</b> (et aux administrateurs) : les autres membres ne le voient même pas apparaître dans le menu. Tout ce qui s'y écrit n'est visible que d'eux — c'est garanti côté serveur, pas seulement à l'affichage.</p>
            <p style={{ margin: "0 0 8px" }}>Il sert à faire vivre l'association entre deux assemblées générales : partager des idées, en discuter, puis trancher par un vote. Deux volets : la <b>💡 boîte à idées</b> et les <b>🗳️ votes</b>. Si votre statut décisionnaire expire, l'onglet disparaît simplement.</p>
            <p style={{ margin: 0 }}><b>C'est la seule différence de fonctionnalité entre les deux statuts sur le site.</b> Un membre non décisionnaire profite de tout le reste à l'identique — ludothèque, moments jeux, parties, chrono, badges, commentaires de jeux. Ce qui lui manque, c'est cet onglet : proposer une idée, la soutenir, la commenter, lancer un vote, y participer ou en lire les résultats.</p>
          </>,
        },
        {
          q: "La boîte à idées",
          a: <>
            <p style={{ margin: "0 0 8px" }}>Cliquez sur <b>« Proposer une idée »</b>, donnez-lui un titre en une phrase et, si besoin, ajoutez le contexte. L'idée apparaît aussitôt pour tous les décisionnaires.</p>
            <p style={{ margin: "0 0 8px" }}>Chacun peut la <b>soutenir</b> (le pouce à gauche, avec son compteur — pratique pour voir ce qui fait consensus avant même de voter) et la <b>commenter</b> pour en discuter.</p>
            <p style={{ margin: "0 0 8px" }}>L'auteur d'une idée (et les administrateurs) peut la <b>modifier</b> à tout moment — titre et détails — via le bouton <b>Modifier</b> ; la mention <i>(modifiée)</i> apparaît alors sous l'idée. Les <b>commentaires</b> se corrigent de la même façon, avec le crayon à leur droite.</p>
            <p style={{ margin: "0 0 8px" }}>L'auteur (et les administrateurs) peut aussi marquer une idée <b>« tranchée »</b> une fois la décision prise, l'<b>archiver</b> pour désencombrer la liste sans rien perdre, ou la supprimer. Les idées archivées restent consultables via le lien en bas de page.</p>
            <p style={{ margin: 0 }}><b>Personne ne rate rien.</b> Tous les décisionnaires reçoivent une notification quand une <b>idée est proposée</b>, quand elle est <b>commentée</b>, quand un <b>vote s'ouvre</b> et quand un <b>vote est clos</b> — jamais pour ses propres actions, bien sûr. Un clic sur la notification ouvre l'onglet Décisionnaire.</p>
          </>,
        },
        {
          q: "Lancer un vote",
          a: <>
            <p style={{ margin: "0 0 8px" }}>Onglet <b>🗳️ Votes</b> → <b>« Lancer un vote »</b>. Vous rédigez la question, ajoutez de <b>2 à 12 réponses</b> possibles, et réglez trois choses :</p>
            <ul style={{ margin: "0 0 8px", paddingLeft: 20, lineHeight: 1.75 }}>
              <li><b>Réponse unique ou multiple</b> : cochez « Autoriser plusieurs réponses » pour que chacun puisse sélectionner plusieurs options, avec un plafond facultatif (« trois choix maximum », par exemple).</li>
              <li><b>Le quorum</b> : le nombre de votants attendus. Le vote reste valable en deçà, mais l'écart est affiché en clair sur la carte (« il en manque 2 ») — de quoi relancer les retardataires.</li>
              <li><b>La date limite</b> : jour et heure de clôture. Le temps restant s'affiche en permanence.</li>
            </ul>
            <p style={{ margin: "0 0 8px" }}>Tous les décisionnaires reçoivent une <b>notification</b> à l'ouverture du vote. L'auteur (et les administrateurs) peut <b>modifier</b> le vote, le <b>clore en avance</b> ou le supprimer.</p>
            <p style={{ margin: 0 }}><b>Ce qu'on peut modifier, et jusqu'à quand.</b> Tant que <b>personne n'a voté</b>, tout est ouvert : question, réponses, mode de scrutin, quorum, date limite. Dès qu'un <b>premier bulletin</b> est déposé, la structure du scrutin se <b>gèle</b> — on ne peut plus ajouter ni retirer de réponse, ni passer de réponse unique à multiple, car cela fausserait les votes déjà exprimés. Restent modifiables : les <b>textes</b> (une faute de frappe ne change pas le sens d'un vote), le <b>quorum</b> et la <b>date limite</b>. Un bandeau vous rappelle la règle et le nombre de votants concernés.</p>
          </>,
        },
        {
          q: "Discuter un vote : la zone de commentaires",
          a: <>
            <p style={{ margin: "0 0 8px" }}>Sous chaque vote — en cours comme terminé — une <b>zone de commentaires</b> permet d'argumenter : préciser une option mal comprise, soulever une objection, proposer un compromis, ou commenter le résultat une fois le scrutin clos.</p>
            <p style={{ margin: "0 0 8px" }}><b>Tous les membres décisionnaires reçoivent une notification</b> à chaque nouveau commentaire (l'auteur excepté) : personne ne rate un argument déposé la veille de la clôture. Un clic sur la notification ramène directement à l'onglet Décisionnaire.</p>
            <p style={{ margin: "0 0 8px" }}>La zone s'<b>ouvre d'office</b> quand des commentaires existent déjà, et reste repliée derrière le bouton « Commenter ce vote » sinon. L'auteur d'un commentaire (et les administrateurs) peut le <b>corriger</b> ou le <b>supprimer</b> ; la mention <i>(modifié)</i> apparaît alors.</p>
            <p style={{ margin: 0 }}><b>Commenter ne trahit pas votre bulletin.</b> Les deux sont indépendants : on peut discuter sans avoir voté, voter sans rien écrire, ou défendre une option puis changer d'avis dans l'isoloir. Comme le reste de l'onglet, ces échanges sont invisibles des membres non décisionnaires.</p>
          </>,
        },
        {
          q: "Voter, changer d'avis, et le secret des résultats",
          a: <>
            <p style={{ margin: "0 0 8px" }}>Sélectionnez votre ou vos réponses, puis validez. <b>Vous pouvez modifier votre vote autant de fois que vous voulez jusqu'à la clôture</b> : rouvrez la carte, changez votre sélection, revalidez. Pour retirer complètement votre vote, décochez tout et validez.</p>
            <p style={{ margin: "0 0 8px" }}><b>Les résultats restent invisibles tant que le vote est ouvert.</b> Chacun ne voit que son propre bulletin — impossible de se laisser influencer par les votes déjà exprimés, ou de deviner qui a voté quoi. Seul le <b>nombre de votants</b> est affiché en direct, puisqu'il ne révèle rien de la répartition et qu'il sert à suivre le quorum.</p>
            <p style={{ margin: "0 0 8px" }}>À la clôture, les résultats apparaîssent sous forme de <b>barres</b> : voix et pourcentage par réponse, la réponse en tête en ambre, et votre propre choix signalé. Le vote bascule alors dans la liste « Terminés ».</p>
            <p style={{ margin: 0 }}>Une exception : les <b>administrateurs</b> peuvent consulter les résultats à tout moment, y compris en cours de vote. Ils restent des votants comme les autres — leur bulletin s'affiche normalement — et les résultats provisoires sont <b>repliés par défaut</b> derrière un lien « Voir les résultats provisoires », précisément pour ne pas influencer leur propre vote. Le dépliant est signalé en violet et mentionne qu'il est réservé aux administrateurs.</p>
          </>,
        },
      ],
    },
    {
      icon: "🧰", title: "En cas de pépin",
      items: [
        {
          q: "Quelque chose ne s'affiche pas ou semble périmé",
          a: <p style={{ margin: 0 }}>Appuyez sur le bouton <RefreshCw size={13} style={{ verticalAlign: "-2px" }} /> (en haut sur mobile) pour recharger les données. Si le problème persiste, fermez et rouvrez l'appli, ou déconnectez-vous puis reconnectez-vous.</p>,
        },
        {
          q: "Je n'arrive plus à me connecter",
          a: <p style={{ margin: 0 }}>Utilisez « Mot de passe oublié ? » sur l'écran de connexion. Si vous vous étiez inscrit avec Google, reconnectez-vous avec le bouton Google. En dernier recours, écrivez à <a href="mailto:aladj50200@gmail.com" style={{ color: C.teal, fontWeight: 700 }}>aladj50200@gmail.com</a>.</p>,
        },
        {
          q: "La sauvegarde des données (administrateurs)",
          a: <>
            <p style={{ margin: "0 0 8px" }}>Depuis <b>Mon espace</b>, les administrateurs disposent d'un bouton <b>« Télécharger une sauvegarde (JSON) »</b>. Il enregistre dans un fichier daté <b>l'intégralité des tables du site</b> : membres et foyers, jeux, extensions, notes, propriétaires, prêts, mécaniques, moments jeux et invités, commentaires, veille, <b>parties et scores</b>, sessions du chronomètre et notifications.</p>
            <p style={{ margin: "0 0 8px" }}>Seules les <b>images</b> n'y figurent pas : elles sont stockées sur un hébergement séparé et ne risquent rien lors d'une manipulation en base.</p>
            <p style={{ margin: "0 0 8px" }}>À la fin de l'export, un <b>récapitulatif</b> affiche le nombre de lignes récupérées table par table, <b>comparé automatiquement au contenu réel de la base</b>. Un bandeau vert confirme que la sauvegarde est complète ; un bandeau rouge signale les tables incomplètes et le nombre de lignes manquantes. Une table légitimement vide s'affiche simplement à zéro, sans alerte.</p>
            <p style={{ margin: 0 }}>À faire <b>régulièrement</b> et systématiquement <b>avant toute opération sensible</b> sur la base. Le fichier se conserve tel quel ; sa réinjection éventuelle passerait par l'éditeur SQL.</p>
          </>,
        },
        {
          q: "J'ai une idée d'amélioration",
          a: <p style={{ margin: 0 }}>Le site évolue en continu grâce aux retours des membres. Partagez vos idées sur la conversation Signal « Blabla » ou par e-mail — les bonnes idées finissent ici !</p>,
        },
      ],
    },
  ];

  return (
    <div style={{ maxWidth: 860, margin: "0 auto", padding: "40px 24px 80px" }}>
      <div style={{ marginBottom: 30 }}>
        <span style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 700, color: C.teal, fontSize: 13, textTransform: "uppercase", letterSpacing: "0.12em" }}>Mode d'emploi</span>
        <h1 style={{ fontFamily: "'Fredoka',sans-serif", color: C.navy, fontSize: "clamp(30px,5vw,44px)", margin: "4px 0 8px", letterSpacing: "-0.02em" }}>Le guide du site & du chrono</h1>
        <p style={{ color: "#8a7c6a", fontSize: 15, lineHeight: 1.6, margin: 0, maxWidth: 640 }}>
          Tout ce qu'il faut savoir pour profiter du site et du chronomètre, question par question. Cliquez sur une question pour dérouler la réponse.
        </p>
      </div>
      {sections.map((sec) => (
        <div key={sec.title} style={{ marginBottom: 28 }}>
          <h2 style={{ fontFamily: "'Fredoka',sans-serif", color: C.navy, fontSize: 21, margin: "0 0 12px", display: "flex", alignItems: "center", gap: 9 }}>
            <span style={{ fontSize: 23 }}>{sec.icon}</span> {sec.title}
          </h2>
          {sec.custom ? sec.custom : (
            <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr)", gap: 8 }}>
              {sec.items.map((it) => <FaqItem key={it.q} q={it.q}>{it.a}</FaqItem>)}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function HomePage({ setPage, onAuth }) {
  const { events, games, users, currentUser, openChrono } = useApp();
  const [showMembers, setShowMembers] = useState(false);
  const [viewMemberId, setViewMemberId] = useState(null); // pour consulter la ludothèque d'un membre
  const [chronoCode, setChronoCode] = useState("");
  const joinChrono = () => {
    const code = chronoCode.trim().toUpperCase();
    if (code.length >= 4) openChrono({ joinCode: code });
  };
  const upcoming = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return [...events].filter((e) => e.date >= today && isEventVisible(e) && canViewEvent(e, currentUser)).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)).slice(0, 3);
  }, [events, currentUser]);
  // nombre de moments à venir (pour le compteur d'accueil)
  const upcomingCount = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return events.filter((e) => e.date >= today && isEventVisible(e) && canViewEvent(e, currentUser)).length;
  }, [events, currentUser]);

  const strongPoints = [
    { icon: Library, c: C.teal, t: "Une ludothèque vivante", d: "Des centaines de jeux partagés par les membres, notés et commentés par la communauté." },
    { icon: Calendar, c: C.red, t: "Des moments jeux toute l'année", d: "Proposez ou rejoignez des moments jeux à Gouville-sur-Mer et dans le Coutançais." },
    { icon: Users, c: C.amber, t: "Une communauté conviviale", d: "Joueurs débutants ou aguerris, on partage le plaisir du jeu sans prise de tête." },
    { icon: Trophy, c: C.purple, t: "Découvertes & classements", d: "Le top des jeux préférés de l'asso, et des classements sur-mesure pour vos tablées." },
  ];

  return (
    <div>
      {/* HERO */}
      <section style={{ position: "relative", overflow: "hidden", background: `linear-gradient(160deg, ${C.navy} 0%, ${C.navyDeep} 60%, #0c1f30 100%)` }}>
        {/* formes décoratives */}
        <Dice color={C.teal} n={5} style={{ position: "absolute", width: 120, top: 60, left: "6%", opacity: .9, transform: "rotate(-12deg)", filter: "drop-shadow(0 12px 24px rgba(0,0,0,.3))" }} />
        <Dice color={C.red} n={3} style={{ position: "absolute", width: 90, top: 220, left: "2%", opacity: .85, transform: "rotate(14deg)", filter: "drop-shadow(0 12px 24px rgba(0,0,0,.3))" }} />
        <Dice color={C.amber} n={6} style={{ position: "absolute", width: 110, bottom: 50, right: "7%", opacity: .9, transform: "rotate(10deg)", filter: "drop-shadow(0 12px 24px rgba(0,0,0,.3))" }} />
        <div style={{ position: "absolute", width: 64, height: 64, top: 80, right: "16%" }}><MeepleIcon size={64} color={C.purple} /></div>
        <div style={{ position: "absolute", width: 44, height: 44, bottom: 120, left: "18%", transform: "rotate(-20deg)" }}><MeepleIcon size={44} color={C.amber} /></div>

        <div style={{ maxWidth: 1180, margin: "0 auto", padding: "84px 24px 96px", position: "relative", textAlign: "center" }}>
          <Badge color={C.amber} soft={false}><MapPin size={13} /> Gouville-sur-Mer · Coutançais · Manche</Badge>
          <h1 style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 700, color: "#fff", fontSize: "clamp(38px, 7vw, 76px)", lineHeight: 1.02, margin: "22px 0 8px", letterSpacing: "-0.03em" }}>
            À l'assaut<br />
            <span style={{ background: `linear-gradient(90deg, ${C.teal}, ${C.amber}, ${C.red}, ${C.purple})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>des jeux !</span>
          </h1>
          <p style={{ color: "rgba(255,255,255,.8)", fontSize: "clamp(16px,2.3vw,20px)", maxWidth: 620, margin: "0 auto 34px", lineHeight: 1.55 }}>
            L'association des passionnés de jeux de société du Coutançais. On se réunit pour jouer, découvrir et partager — autour d'une grande table et de centaines de jeux.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            {!currentUser && <Btn variant="amber" size="lg" onClick={() => onAuth("register")}><Sparkles size={19} /> Rejoindre l'asso</Btn>}
            <Btn variant="teal" size="lg" onClick={() => setPage("soirees")}><Calendar size={19} /> Voir les moments jeux</Btn>
            <Btn size="lg" onClick={() => setPage("ludotheque")} style={{ background: "rgba(255,255,255,.12)", border: "2px solid rgba(255,255,255,.3)", color: "#fff" }}>
              <Library size={19} /> La ludothèque
            </Btn>
          </div>

          <div style={{ display: "flex", gap: "clamp(20px,5vw,64px)", justifyContent: "center", marginTop: 56, flexWrap: "wrap" }}>
            {[
              { n: games.filter((g) => !g.unowned).length, l: "jeux partagés", onClick: () => setPage("ludotheque") },
              { n: users.length, l: "membres", onClick: () => setShowMembers(true) },
              { n: upcomingCount, l: "moments à venir", onClick: () => setPage("soirees") },
              { n: "2010", l: "depuis", onClick: null },
            ].map((s, i) => (
              <div key={i} onClick={s.onClick || undefined} style={{ textAlign: "center", cursor: s.onClick ? "pointer" : "default", transition: "transform .15s", ...(s.onClick ? {} : {}) }}
                onMouseEnter={(e) => { if (s.onClick) e.currentTarget.style.transform = "translateY(-3px)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; }}>
                <div style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 700, fontSize: 38, color: "#fff", lineHeight: 1, textDecoration: s.onClick ? "underline" : "none", textDecorationColor: "rgba(255,255,255,.3)", textUnderlineOffset: 6 }}>{s.n}</div>
                <div style={{ color: "rgba(255,255,255,.6)", fontSize: 14, marginTop: 4 }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>
        <svg viewBox="0 0 1440 60" style={{ display: "block", width: "100%", height: 50 }} preserveAspectRatio="none"><path d="M0 60 L0 30 Q360 0 720 24 T1440 20 L1440 60 Z" fill={C.cream} /></svg>
      </section>

      {/* ---- Nouveauté : soirées jeux en ligne (BGA) ---- */}
      <section style={{ maxWidth: 1080, margin: "0 auto", padding: "28px 24px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap", background: `linear-gradient(135deg, ${C.purple}, #4a2856)`, borderRadius: 22, padding: "24px 26px", color: "#fff", boxShadow: "0 14px 36px rgba(107,58,122,.28)" }}>
          <div style={{ display: "grid", placeItems: "center", width: 56, height: 56, borderRadius: 16, background: "rgba(255,255,255,.16)", flexShrink: 0 }}>
            <Globe size={30} />
          </div>
          <div style={{ flex: 1, minWidth: 220 }}>
            <div style={{ fontFamily: "'Fredoka',sans-serif", fontSize: "clamp(20px,3vw,26px)", fontWeight: 700, lineHeight: 1.1, marginBottom: 6 }}>Nouveau : nos soirées jeux en ligne&nbsp;!</div>
            <p style={{ margin: 0, fontSize: 15, lineHeight: 1.5, opacity: .92 }}>
              En plus de nos rendez-vous au local, l'association organise désormais des parties <b>en ligne sur Board&nbsp;Game&nbsp;Arena</b>. <b>Les jeux y sont gratuits pour vous</b> : l'association dispose d'un compte premium qui permet de lancer tous les jeux et d'inviter les participants à la table. Repérez les moments « en ligne » (en violet) dans le calendrier, et rejoignez la conversation Signal dédiée pour nous retrouver à l'heure du rendez-vous.
            </p>
          </div>
          <a href="https://signal.group/#CjQKIDrh0Erb7vmLuqhbBcjelvyRNlakSz8S0DWuwYzbY9PMEhCa0Qkdic8YD72P2HPBjUVK" target="_blank" rel="noopener noreferrer"
            style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#fff", color: C.purple, fontFamily: "'Fredoka',sans-serif", fontWeight: 700, fontSize: 15, padding: "12px 18px", borderRadius: 13, textDecoration: "none", whiteSpace: "nowrap" }}>
            <Globe size={17} /> Conversation « Jeux en ligne »
          </a>
        </div>
      </section>

      {/* POINTS FORTS */}
      <section style={{ maxWidth: 1180, margin: "0 auto", padding: "64px 24px 20px" }}>
        <SectionTitle kicker="Pourquoi nous rejoindre" title="Nos points forts" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 18, marginTop: 36 }}>
          {strongPoints.map((p, i) => {
            const Icon = p.icon;
            return (
              <div key={i} style={{ background: C.paper, borderRadius: 20, padding: 26, border: "1px solid #ece2d0", boxShadow: "0 4px 18px rgba(18,41,63,.05)" }}>
                <div style={{ width: 54, height: 54, borderRadius: 15, background: `${p.c}1a`, display: "grid", placeItems: "center", marginBottom: 16 }}>
                  <Icon size={26} color={p.c} />
                </div>
                <h3 style={{ fontFamily: "'Fredoka',sans-serif", color: C.navy, fontSize: 19, margin: "0 0 8px" }}>{p.t}</h3>
                <p style={{ color: "#6e6256", fontSize: 14.5, lineHeight: 1.55, margin: 0 }}>{p.d}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* PROCHAINES SOIRÉES */}
      <section style={{ maxWidth: 1180, margin: "0 auto", padding: "56px 24px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 12 }}>
          <SectionTitle kicker="Agenda" title="Les 3 prochains moments jeux" noMargin />
          <Btn variant="soft" size="sm" onClick={() => setPage("soirees")}>Tout voir <ArrowRight size={15} /></Btn>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 18, marginTop: 32 }}>
          {upcoming.length === 0 && <EmptyHint icon={Calendar} text="Aucun moment jeux programmé pour l'instant." />}
          {upcoming.map((e) => <EventCardMini key={e.id} e={e} onOpen={() => setPage("soirees")} />)}
        </div>
      </section>

      {/* ADHÉSION */}
      <section style={{ maxWidth: 1080, margin: "0 auto", padding: "56px 24px 80px" }}>
        <SectionTitle kicker="Adhésion" title="Rejoindre l'association" center />
        <p style={{ textAlign: "center", color: "#5e5346", fontSize: 15.5, lineHeight: 1.7, maxWidth: 720, margin: "20px auto 36px" }}>
          Deux formules d'adhésion existent, mais <b>tous les membres profitent pleinement de l'asso</b> : moments jeux, ludothèque, notations, location, gestion personnelle... La différence se résume à <b>deux points seulement</b>.
        </p>

        {/* Tronc commun (ce que TOUS les membres ont) */}
        <div style={{ background: C.paper, borderRadius: 22, padding: "28px 32px", border: "1px solid #ece2d0", marginBottom: 24, boxShadow: "0 4px 14px rgba(18,41,63,.04)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, justifyContent: "center" }}>
            <Check size={20} color={C.teal} />
            <h3 style={{ fontFamily: "'Fredoka',sans-serif", color: C.navy, fontSize: 19, margin: 0 }}>Ce que tous les membres partagent</h3>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14, fontSize: 14, color: "#5e5346", lineHeight: 1.5 }}>
            <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}><Check size={16} color={C.teal} style={{ marginTop: 2, flexShrink: 0 }} /> Accès complet à la ludothèque partagée lors des moments jeux</div>
            <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}><Check size={16} color={C.teal} style={{ marginTop: 2, flexShrink: 0 }} /> Création et participation aux moments jeux</div>
            <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}><Check size={16} color={C.teal} style={{ marginTop: 2, flexShrink: 0 }} /> Gestion libre de sa ludothèque personnelle</div>
            <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}><Check size={16} color={C.teal} style={{ marginTop: 2, flexShrink: 0 }} /> Notation des jeux et accès complet au site</div>
            <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}><Check size={16} color={C.teal} style={{ marginTop: 2, flexShrink: 0 }} /> Location de jeux entre membres</div>
            <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}><Check size={16} color={C.teal} style={{ marginTop: 2, flexShrink: 0 }} /> Mêmes tarifs de location (10 % du prix neuf)</div>
          </div>
        </div>

        {/* Les 2 vraies différences */}
        <h3 style={{ fontFamily: "'Fredoka',sans-serif", color: C.navy, fontSize: 18, textAlign: "center", margin: "0 0 18px" }}>Les deux seules différences entre les formules</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 18, marginBottom: 24 }}>
          {/* Décisionnaire */}
          <div style={{ background: "#fff", borderRadius: 20, padding: "26px 26px 22px", border: `2px solid ${C.amber}`, position: "relative" }}>
            <div style={{ position: "absolute", top: -14, left: 22, background: C.amber, color: "#fff", padding: "5px 14px", borderRadius: 999, fontFamily: "'Fredoka',sans-serif", fontWeight: 700, fontSize: 13, display: "inline-flex", alignItems: "center", gap: 6 }}><Crown size={14} /> Décisionnaire</div>
            <div style={{ marginTop: 8, marginBottom: 16 }}>
              <span style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 700, color: C.navy, fontSize: 28 }}>20 €</span>
              <span style={{ color: "#9c8d79", fontSize: 14 }}> / an</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr)", gap: 12 }}>
              <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <span style={{ flexShrink: 0, width: 28, height: 28, borderRadius: 8, background: "rgba(232,163,23,.18)", display: "grid", placeItems: "center" }}><Award size={15} color={C.amber} /></span>
                <span style={{ fontSize: 14, color: "#5e5346", lineHeight: 1.5 }}><b style={{ color: C.navy }}>Voix délibérative</b> en assemblée générale — vous participez aux décisions de l'association.</span>
              </div>
              <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <span style={{ flexShrink: 0, width: 28, height: 28, borderRadius: 8, background: "rgba(232,163,23,.18)", display: "grid", placeItems: "center" }}><Check size={15} color={C.amber} /></span>
                <span style={{ fontSize: 14, color: "#5e5346", lineHeight: 1.5 }}><b style={{ color: C.navy }}>Dispense de caution</b> sur la location des jeux entre membres.</span>
              </div>
              <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <span style={{ flexShrink: 0, width: 28, height: 28, borderRadius: 8, background: "rgba(232,163,23,.18)", display: "grid", placeItems: "center" }}><Ticket size={15} color={C.amber} /></span>
                <span style={{ fontSize: 14, color: "#5e5346", lineHeight: 1.5 }}><b style={{ color: C.navy }}>Pass Ludovore annuel</b> (valeur 29,99 €) grâce à notre partenariat avec Ludum.</span>
              </div>
            </div>
            {!currentUser && <Btn full variant="amber" size="md" style={{ marginTop: 18 }} onClick={() => onAuth("register")}><UserPlus size={15} /> Adhérer</Btn>}
          </div>

          {/* Non décisionnaire */}
          <div style={{ background: "#fff", borderRadius: 20, padding: "26px 26px 22px", border: `2px solid ${C.teal}`, position: "relative" }}>
            <div style={{ position: "absolute", top: -14, left: 22, background: C.teal, color: "#fff", padding: "5px 14px", borderRadius: 999, fontFamily: "'Fredoka',sans-serif", fontWeight: 700, fontSize: 13, display: "inline-flex", alignItems: "center", gap: 6 }}><Heart size={14} /> Non décisionnaire</div>
            <div style={{ marginTop: 8, marginBottom: 16 }}>
              <span style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 700, color: C.navy, fontSize: 28 }}>Gratuit</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr)", gap: 12 }}>
              <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <span style={{ flexShrink: 0, width: 28, height: 28, borderRadius: 8, background: "rgba(30,138,138,.15)", display: "grid", placeItems: "center" }}><Info size={15} color={C.teal} /></span>
                <span style={{ fontSize: 14, color: "#5e5346", lineHeight: 1.5 }}>Pas de voix délibérative en AG (présence possible à titre consultatif).</span>
              </div>
              <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <span style={{ flexShrink: 0, width: 28, height: 28, borderRadius: 8, background: "rgba(30,138,138,.15)", display: "grid", placeItems: "center" }}><Info size={15} color={C.teal} /></span>
                <span style={{ fontSize: 14, color: "#5e5346", lineHeight: 1.5 }}>Caution possible (au prix neuf du jeu) demandée par le prêteur lors d'une location.</span>
              </div>
            </div>
            {!currentUser && <Btn full variant="teal" size="md" style={{ marginTop: 18 }} onClick={() => onAuth("register")}><UserPlus size={15} /> Créer un compte gratuit</Btn>}
          </div>
        </div>

        <p style={{ textAlign: "center", color: "#8a7c6a", fontSize: 14, marginTop: 26, maxWidth: 720, marginLeft: "auto", marginRight: "auto", lineHeight: 1.6 }}>
          <Info size={15} style={{ verticalAlign: "-2px" }} /> Association loi 1901 fondée le 13 octobre 2010 à Coutances. La cotisation est fixée chaque année par l'assemblée générale. L'association est ouverte aux adultes de 18 ans et plus ; les jeunes de 14 ans et plus sont les bienvenus s'ils sont joueurs et accompagnés d'un adulte. Une pièce d'identité peut être demandée à l'entrée des moments jeux.
          <br /><span style={{ display: "inline-flex", alignItems: "center", gap: 5, verticalAlign: "-2px" }}><PacifierIcon size={13} /></span> Les <b>enfants de moins de 14 ans peuvent tout à fait avoir un compte</b> sur le site (une tétine signale alors leur profil) et participer aux <b>moments jeux privés</b>. En revanche, ils ne peuvent pas participer aux moments jeux de l'association ouverts à tous, en présentiel comme sur Board Game Arena.
        </p>
      </section>

      {/* SOUTENIR L'ASSO — PARTENAIRE LUDUM */}
      <section style={{ maxWidth: 1080, margin: "0 auto", padding: "20px 24px 40px" }}>
        <div style={{ position: "relative", overflow: "hidden", background: `linear-gradient(135deg, ${C.navy} 0%, ${C.navyDeep} 100%)`, borderRadius: 24, padding: "clamp(28px,4vw,44px)", boxShadow: "0 10px 30px rgba(18,41,63,.14)" }}>
          <Dice color={C.amber} n={6} style={{ position: "absolute", width: 96, top: -16, right: 28, opacity: .22, transform: "rotate(12deg)" }} />
          <Dice color={C.teal} n={4} style={{ position: "absolute", width: 64, bottom: -10, right: 132, opacity: .18, transform: "rotate(-10deg)" }} />
          <div style={{ position: "relative", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 28 }}>
            <div style={{ flex: "1 1 340px" }}>
              <Badge color={C.amber} soft={false}><Heart size={13} /> Notre partenaire</Badge>
              <h2 style={{ fontFamily: "'Fredoka',sans-serif", color: "#fff", fontSize: "clamp(24px,3.6vw,32px)", margin: "16px 0 10px", lineHeight: 1.1 }}>
                Achetez chez Ludum, soutenez l'asso
              </h2>
              <p style={{ color: "rgba(255,255,255,.82)", fontSize: 15.5, lineHeight: 1.6, margin: "0 0 8px", maxWidth: 540 }}>
                Pour soutenir l'association, pensez à acheter vos jeux chez <b style={{ color: "#fff" }}>Ludum</b> via notre lien partenaire. Une partie de votre achat revient à l'ALADJ, sans aucun surcoût pour vous.
              </p>
              <p style={{ color: "rgba(255,255,255,.6)", fontSize: 13.5, lineHeight: 1.55, margin: 0 }}>
                <Ticket size={13} style={{ verticalAlign: "-2px" }} /> Les membres cotisants profitent en plus du <b style={{ color: C.amber }}>pass Ludovore annuel</b> (valeur 29,99 €).
              </p>
            </div>
            <a href="https://www.ludum.fr/?aff=146" target="_blank" rel="noopener noreferrer sponsored"
              style={{ display: "inline-flex", alignItems: "center", gap: 9, background: C.amber, color: "#fff", fontFamily: "'Fredoka',sans-serif", fontWeight: 700, fontSize: 17, padding: "15px 28px", borderRadius: 14, textDecoration: "none", boxShadow: "0 8px 22px rgba(232,163,23,.45)", whiteSpace: "nowrap", flexShrink: 0 }}>
              <ShoppingBag size={19} /> Acheter chez Ludum
            </a>
          </div>
        </div>
      </section>

      {/* ---- Location de jeux : règles ---- */}
      <section style={{ maxWidth: 1080, margin: "0 auto", padding: "20px 24px 60px" }}>
        <SectionTitle kicker="Entre membres" title="La location de jeux" center />
        <div style={{ background: C.paper, border: `2px solid ${C.teal}`, borderRadius: 22, padding: "28px 32px", marginTop: 28, boxShadow: "0 6px 20px rgba(18,41,63,.06)" }}>
          <p style={{ fontSize: 15, color: "#5e5346", lineHeight: 1.7, margin: "0 0 18px" }}>
            Les membres de l'association peuvent <b>se louer des jeux entre eux</b>, pour le plaisir d'essayer chez soi avant d'acheter, ou simplement pour profiter d'un jeu d'un autre membre le temps d'une soirée.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 18, marginBottom: 20 }}>
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <div style={{ flexShrink: 0, width: 38, height: 38, borderRadius: 11, background: "rgba(30,138,138,.12)", display: "grid", placeItems: "center" }}>
                <Euro size={18} color={C.teal} />
              </div>
              <div>
                <div style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 700, color: C.navy, fontSize: 14.5, marginBottom: 3 }}>Tarif</div>
                <div style={{ fontSize: 13.5, color: "#6e6256", lineHeight: 1.55 }}>10% du prix neuf du jeu, arrondi au 0,50 € supérieur. La durée de location est fixée à <b>2 semaines</b>.</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <div style={{ flexShrink: 0, width: 38, height: 38, borderRadius: 11, background: "rgba(232,163,23,.15)", display: "grid", placeItems: "center" }}>
                <Crown size={18} color={C.amber} />
              </div>
              <div>
                <div style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 700, color: C.navy, fontSize: 14.5, marginBottom: 3 }}>Caution</div>
                <div style={{ fontSize: 13.5, color: "#6e6256", lineHeight: 1.55 }}>Les <b>membres décisionnaires</b> en sont dispensés. Pour les autres membres, une caution équivalente au prix neuf du jeu peut être demandée par le prêteur.</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <div style={{ flexShrink: 0, width: 38, height: 38, borderRadius: 11, background: "rgba(181,40,58,.12)", display: "grid", placeItems: "center" }}>
                <Package size={18} color={C.red} />
              </div>
              <div>
                <div style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 700, color: C.navy, fontSize: 14.5, marginBottom: 3 }}>Jeu abîmé ou incomplet</div>
                <div style={{ fontSize: 13.5, color: "#6e6256", lineHeight: 1.55 }}>L'emprunteur s'engage à <b>rembourser le prêteur</b> à hauteur du préjudice si le jeu est rendu détérioré ou avec des pièces manquantes.</div>
              </div>
            </div>
          </div>
          <p style={{ fontSize: 13, color: "#9c8d79", margin: 0, textAlign: "center", lineHeight: 1.55, borderTop: "1px solid #f0e8d8", paddingTop: 14 }}>
            <Info size={13} style={{ verticalAlign: "-2px" }} /> Le tarif et le suivi de chaque location se gèrent depuis la fiche du jeu, dans la rubrique <b>Location</b>. Retrouvez vos prêts et emprunts en cours sur la page <b>Mes locations</b>.
          </p>
        </div>
      </section>

      {/* ---- Conversations Signal ---- */}
      <section style={{ maxWidth: 1080, margin: "0 auto", padding: "20px 24px 80px" }}>
        <SectionTitle kicker="Rester en contact" title="Nos conversations Signal" center />
        <p style={{ textAlign: "center", color: "#8a7c6a", fontSize: 15, margin: "10px auto 36px", maxWidth: 620, lineHeight: 1.6 }}>
          La vie de l'association se passe sur Signal. Rejoignez les groupes qui vous intéressent en cliquant sur le bouton, ou en scannant le QR code avec votre téléphone.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 22 }}>
          {SIGNAL_GROUPS.map((grp) => (
            <div key={grp.name} style={{ background: C.paper, border: "1px solid #ece2d0", borderRadius: 20, padding: 26, textAlign: "center", boxShadow: "0 4px 16px rgba(18,41,63,.05)", display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ width: 52, height: 52, borderRadius: 15, background: grp.color, display: "grid", placeItems: "center", marginBottom: 14 }}>
                <grp.icon size={26} color="#fff" />
              </div>
              <h3 style={{ fontFamily: "'Fredoka',sans-serif", color: C.navy, fontSize: 19, margin: "0 0 6px" }}>{grp.name}</h3>
              <p style={{ color: "#8a7c6a", fontSize: 13.5, lineHeight: 1.5, margin: "0 0 18px", flex: 1 }}>{grp.desc}</p>
              <img src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&margin=8&data=${encodeURIComponent(grp.url)}`} alt={`QR code ${grp.name}`}
                style={{ width: 140, height: 140, borderRadius: 12, border: "1px solid #ece2d0", marginBottom: 16 }} />
              <a href={grp.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", width: "100%" }}>
                <Btn full variant="primary" size="md" style={{ background: grp.color, borderColor: grp.color }}><ExternalLink size={16} /> Rejoindre</Btn>
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* ---- Chrono : rejoindre une partie en cours ---- */}
      <section style={{ maxWidth: 1080, margin: "0 auto", padding: "10px 24px" }}>
        <div style={{ background: C.cream, border: `2px solid ${C.teal}33`, borderRadius: 22, padding: "26px 24px", textAlign: "center" }}>
          <Clock size={28} style={{ color: C.teal, marginBottom: 10 }} />
          <h2 style={{ fontFamily: "'Fredoka',sans-serif", fontSize: 22, margin: "0 0 6px", color: C.navy }}>Rejoindre une partie chronométrée</h2>
          <p style={{ fontSize: 14.5, color: C.navy, opacity: .75, margin: "0 0 18px", lineHeight: 1.5, maxWidth: 480, marginLeft: "auto", marginRight: "auto" }}>
            Saisissez le code donné par l'organisateur pour suivre votre temps de jeu sur votre téléphone.
          </p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap", maxWidth: 440, margin: "0 auto" }}>
            <input
              value={chronoCode}
              onChange={(e) => setChronoCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => { if (e.key === "Enter") joinChrono(); }}
              placeholder="Ex. VPDMS3"
              maxLength={8}
              style={{ flex: 1, minWidth: 170, padding: "13px 16px", borderRadius: 13, border: `1.5px solid ${C.teal}66`, fontSize: 18, fontFamily: "'Fredoka',sans-serif", fontWeight: 700, letterSpacing: 4, textAlign: "center", textTransform: "uppercase", color: C.navy, background: "#fff", outline: "none" }}
            />
            <Btn variant="teal" onClick={joinChrono} disabled={chronoCode.trim().length < 4}>
              <Clock size={17} /> Rejoindre
            </Btn>
          </div>
        </div>
      </section>

      {/* ---- Nous contacter (par e-mail) ---- */}
      <section style={{ maxWidth: 1080, margin: "0 auto", padding: "10px 24px 60px" }}>
        <div style={{ background: `linear-gradient(135deg, ${C.teal}, ${C.navy})`, borderRadius: 22, padding: "32px 28px", color: "#fff", textAlign: "center", boxShadow: "0 8px 24px rgba(18,41,63,.12)" }}>
          <Mail size={32} style={{ marginBottom: 12, opacity: .9 }} />
          <h2 style={{ fontFamily: "'Fredoka',sans-serif", fontSize: 26, margin: "0 0 8px" }}>Une question ? Envie de nous rejoindre ?</h2>
          <p style={{ fontSize: 15, opacity: .9, margin: "0 0 18px", lineHeight: 1.55, maxWidth: 540, marginLeft: "auto", marginRight: "auto" }}>
            Écrivez-nous directement, on vous répond avec plaisir.
          </p>
          <div style={{ background: "rgba(255,255,255,.14)", borderRadius: 14, padding: "14px 20px", margin: "0 auto 22px", maxWidth: 560, fontSize: 14.5, lineHeight: 1.6 }}>
            <b>Nouveau membre&nbsp;?</b> Pensez à vous présenter auprès de l'association, soit dans la conversation Signal «&nbsp;Organisation jeux&nbsp;», soit par e-mail. Cela nous permet de faire connaissance et de vous accueillir comme il se doit&nbsp;!
          </div>
          <a href="mailto:aladj50200@gmail.com" style={{ display: "inline-flex", alignItems: "center", gap: 10, background: "#fff", color: C.navy, padding: "13px 26px", borderRadius: 13, textDecoration: "none", fontFamily: "'Fredoka',sans-serif", fontWeight: 700, fontSize: 16, boxShadow: "0 4px 14px rgba(0,0,0,.15)" }}>
            <Mail size={18} /> aladj50200@gmail.com
          </a>
        </div>
      </section>

      {showMembers && <MembersModal onClose={() => setShowMembers(false)} onPickMember={(id) => { setShowMembers(false); setViewMemberId(id); }} />}
      {viewMemberId && <MemberLibraryModal memberId={viewMemberId} onClose={() => setViewMemberId(null)} onAuth={onAuth} />}
    </div>
  );
}

/* ---- Pop-up : liste des membres, couleur selon statut ---- */
function MembersModal({ onClose, onPickMember }) {
  const { users, currentUser, memberEmails, banUser, unbanUser, deleteUser, adminAddMembershipDays, adminRevokeMembership } = useApp();
  const isAdmin = currentUser && currentUser.admin;
  const [busyId, setBusyId] = useState(null);
  const [editMember, setEditMember] = useState(null); // profil ouvert en modification (admin)
  const [confirmBan, setConfirmBan] = useState(null); // id du membre en attente de confirmation de bannissement
  const [confirmDelete, setConfirmDelete] = useState(null); // id du membre en attente de confirmation de suppression
  // Tri : les bannis en bas, puis alphabétique
  const sorted = [...users].sort((a, b) => {
    if (a.banned !== b.banned) return a.banned ? 1 : -1;
    return a.name.localeCompare(b.name);
  });

  const doBan = async (id) => {
    setBusyId(id);
    await banUser(id);
    setBusyId(null); setConfirmBan(null);
  };
  const doUnban = async (id) => {
    setBusyId(id);
    await unbanUser(id);
    setBusyId(null);
  };
  const doDelete = async (id) => {
    setBusyId(id);
    const res = await deleteUser(id);
    setBusyId(null); setConfirmDelete(null);
    if (res?.error) alert(res.error);
  };
  // Accorde des jours de statut décisionnaire (ou retire le statut).
  const doRole = async (m) => {
    const left = m.decideurUntil ? Math.max(0, Math.ceil((new Date(m.decideurUntil) - new Date()) / 86400000)) : 0;
    const input = window.prompt(
      `${m.name} — statut décisionnaire : ${left > 0 ? `encore ${left} jour${left > 1 ? "s" : ""}` : "inactif"}.\n\nNombre de jours à AJOUTER (ex. 365), ou 0 pour retirer le statut :`,
      "365"
    );
    if (input === null) return;
    const days = parseInt(input, 10);
    if (isNaN(days) || days < 0) { alert("Nombre invalide."); return; }
    setBusyId(m.id);
    const res = days === 0 ? await adminRevokeMembership(m.id) : await adminAddMembershipDays(m.id, days);
    setBusyId(null);
    if (res?.error) alert(res.error);
  };

  return (
    <Modal open onClose={onClose} title={`Les membres de l'association (${users.length})`} width={isAdmin ? 540 : 460}>
      <div style={{ display: "flex", gap: 14, marginBottom: 16, fontSize: 12.5, color: "#8a7c6a", flexWrap: "wrap" }}>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 12, height: 12, borderRadius: 4, background: C.amber }} /> Décisionnaire</span>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 12, height: 12, borderRadius: 4, background: C.teal }} /> Non décisionnaire</span>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}><PacifierIcon size={12} /> Compte enfant</span>
        {isAdmin && <span style={{ display: "flex", alignItems: "center", gap: 6, color: C.purple, fontWeight: 700 }}><ShieldCheck size={13} /> Vue administrateur</span>}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr)", gap: 8, maxHeight: "55vh", overflowY: "auto" }}>
        {sorted.map((m) => {
          const color = m.role === "decideur" ? C.amber : C.teal;
          const email = memberEmails[m.id];
          const isMe = currentUser && m.id === currentUser.id;
          return (
            <div key={m.id} style={{
              display: "flex", alignItems: "center", gap: 12, padding: "11px 14px", borderRadius: 13,
              border: m.banned ? `1px solid ${C.red}` : "1px solid #efe6d6",
              background: m.banned ? "rgba(181,40,58,.05)" : "#fff", opacity: m.banned ? 0.85 : 1,
            }}>
              <button onClick={() => onPickMember(m.id)} title="Voir sa ludothèque" style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0, background: "none", border: "none", cursor: "pointer", textAlign: "left", padding: 0 }}>
                <span style={{ position: "relative", flexShrink: 0 }}>
                  <span style={{ width: 38, height: 38, borderRadius: 11, overflow: "hidden", background: color, color: "#fff", display: "grid", placeItems: "center", fontFamily: "'Fredoka',sans-serif", fontWeight: 700, fontSize: 16 }}>
                    {m.avatar
                      ? <img src={m.avatar} alt={m.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : m.name[0].toUpperCase()}
                  </span>
                  {m.role === "decideur" && (
                    <span style={{ position: "absolute", top: -6, right: -6, background: C.amber, borderRadius: "50%", width: 18, height: 18, display: "grid", placeItems: "center", border: "2px solid #fff", boxShadow: "0 1px 3px rgba(0,0,0,.2)" }} title="Membre décisionnaire">
                      <Crown size={10} color="#fff" />
                    </span>
                  )}
                  {isChildAccount(m) && (
                    <span style={{ position: "absolute", bottom: -6, right: -6, background: "#fff", borderRadius: "50%", width: 19, height: 19, display: "grid", placeItems: "center", border: `2px solid ${C.purple}`, boxShadow: "0 1px 3px rgba(0,0,0,.2)" }} title={`Compte enfant (moins de ${CHILD_AGE_LIMIT} ans)`}>
                      <PacifierIcon size={11} />
                    </span>
                  )}
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: "'Fredoka',sans-serif", fontWeight: 600, color: C.navy, fontSize: 15 }}>
                    {m.name}
                    {isChildAccount(m) && <PacifierIcon size={13} />}
                    <FeaturedBadgesInline member={m} size={17} />
                    {m.admin && <ShieldCheck size={13} color={C.purple} />}
                    {m.banned && <span style={{ fontSize: 10.5, background: C.red, color: "#fff", borderRadius: 5, padding: "1px 6px", fontWeight: 700 }}>BANNI</span>}
                  </span>
                  <span style={{ display: "block", fontSize: 12, color }}>{m.role === "decideur" ? "Membre décisionnaire" : "Membre non décisionnaire"}{isChildAccount(m) ? " · compte enfant" : ""}</span>
                  {isAdmin && email && <span style={{ display: "block", fontSize: 11.5, color: "#9c8d79", marginTop: 1 }}>{email}</span>}
                </span>
              </button>
              {isAdmin && !isMe && (
                confirmDelete === m.id ? (
                  <span style={{ display: "flex", gap: 5 }}>
                    <Btn size="sm" variant="danger" onClick={() => doDelete(m.id)} disabled={busyId === m.id}>{busyId === m.id ? <Loader2 size={13} className="aladj-spin" /> : "Supprimer définitivement"}</Btn>
                    <Btn size="sm" variant="soft" onClick={() => setConfirmDelete(null)}>Non</Btn>
                  </span>
                ) : m.banned ? (
                  <span style={{ display: "flex", gap: 5 }}>
                    <Btn size="sm" variant="teal" onClick={() => doUnban(m.id)} disabled={busyId === m.id}>{busyId === m.id ? <Loader2 size={13} className="aladj-spin" /> : <>Débannir</>}</Btn>
                    <Btn size="sm" variant="soft" onClick={() => setConfirmDelete(m.id)} title="Supprimer définitivement"><Trash2 size={13} /></Btn>
                  </span>
                ) : confirmBan === m.id ? (
                  <span style={{ display: "flex", gap: 5 }}>
                    <Btn size="sm" variant="danger" onClick={() => doBan(m.id)} disabled={busyId === m.id}>{busyId === m.id ? <Loader2 size={13} className="aladj-spin" /> : "Confirmer"}</Btn>
                    <Btn size="sm" variant="soft" onClick={() => setConfirmBan(null)}>Non</Btn>
                  </span>
                ) : (
                  <span style={{ display: "flex", gap: 5 }}>
                    <Btn size="sm" variant={m.role === "decideur" ? "amber" : "soft"} onClick={() => doRole(m)} disabled={busyId === m.id} title="Gérer le statut décisionnaire (jours)">
                      {busyId === m.id ? <Loader2 size={13} className="aladj-spin" /> : <Crown size={13} />}
                    </Btn>
                    <Btn size="sm" variant="soft" onClick={() => setEditMember(m)} title={`Modifier le profil de ${m.name}`}><Pencil size={13} /></Btn>
                    <Btn size="sm" variant="soft" onClick={() => setConfirmDelete(m.id)} title="Supprimer définitivement"><Trash2 size={13} /></Btn>
                    <Btn size="sm" variant="soft" onClick={() => setConfirmBan(m.id)} title="Bannir ce membre"><Lock size={13} /></Btn>
                  </span>
                )
              )}
              {!isAdmin && <ChevronRight size={18} color="#c9bba6" />}
            </div>
          );
        })}
      </div>
      <p style={{ fontSize: 12.5, color: "#a89a86", marginTop: 14, textAlign: "center" }}>
        {isAdmin ? "Cliquez sur un membre pour voir sa ludothèque. Le crayon ouvre son profil en modification. Le bannissement bloque l'accès au site sans supprimer ses jeux." : "Cliquez sur un membre pour voir sa ludothèque."}
      </p>
      {editMember && <ProfileEditModal member={editMember} onClose={() => setEditMember(null)} />}
    </Modal>
  );
}

/* ---- Pop-up : consultation de la ludothèque d'un membre ---- */
function MemberLibraryModal({ memberId, onClose, setToast = () => {}, onAuth = () => {} }) {
  const [gameOpen, setGameOpen] = useState(null); // fiche jeu ouverte depuis le top 10
  const [editOpen, setEditOpen] = useState(false); // modification du profil (administrateurs)
  const { games, users, plays, events, upcoming, beltByGame, householdByUser, currentUser } = useApp();
  const member = users.find((u) => u.id === memberId);
  // ludothèque triée par note du membre (du mieux noté au moins bien), puis alphabétique
  const theirGames = games.filter((g) => (g.ownerIds || []).includes(memberId)).sort((a, b) => {
    const ra = a.ratings?.[memberId] || 0, rb = b.ratings?.[memberId] || 0;
    if (rb !== ra) return rb - ra;
    return a.name.localeCompare(b.name, "fr");
  });
  const initial = member ? member.name[0].toUpperCase() : "?";
  // Top 10 ever du membre (jeux encore présents en ludothèque)
  const theirTop = (member?.topGames || []).filter((id) => games.some((g) => g.id === id));
  // Foyer : autres membres avec qui il partage sa ludothèque
  const famIds = (householdByUser[memberId] || []).filter((id) => id !== memberId);
  const famNames = famIds.map((id) => users.find((u) => u.id === id)?.name).filter(Boolean);
  // Ludothèque familiale : les jeux des autres membres du foyer, qui ne sont pas déjà à son nom.
  // Ils sont TOUJOURS affichés (en petites vignettes), en complément de ses jeux personnels.
  const famGames = famIds.length
    ? games.filter((g) => !(g.ownerIds || []).includes(memberId) && (g.ownerIds || []).some((id) => famIds.includes(id))).sort((a, b) => a.name.localeCompare(b.name, "fr"))
    : [];
  // Top 10 des jeux les plus joués par ce membre, d'après l'historique des parties enregistrées.
  const theirMostPlayed = useMemo(() => {
    const byGame = {};
    (plays || []).forEach((pl) => {
      const part = (pl.participants || []).find((pt) => pt.userId === memberId && pt.confirmed !== false);
      if (!part) return;
      const e = (byGame[pl.gameId] ||= { gameId: pl.gameId, count: 0, wins: 0 });
      e.count++;
      if (part.isWinner) e.wins++;
    });
    return Object.values(byGame)
      .map((e) => ({ ...e, game: games.find((g) => g.id === e.gameId) || null }))
      .filter((e) => e.game)
      .sort((a, b) => (b.count - a.count) || a.game.name.localeCompare(b.game.name, "fr"))
      .slice(0, 10);
  }, [plays, games, memberId]);
  // Nombre d'extensions que ce membre possède
  const theirExtCount = (() => {
    let n = 0;
    games.forEach((g) => (g.extensions || []).forEach((x) => { if ((x.ownerIds || []).includes(memberId)) n++; }));
    return n;
  })();
  return (
    <Modal open onClose={onClose} title={member ? member.name : "Membre"} width={640}>
      {member && (
        <div style={{ marginBottom: 20 }}>
          {/* en-tête profil */}
          <div style={{ display: "flex", gap: 16, alignItems: "flex-start", marginBottom: member.bio ? 14 : 0 }}>
            <div style={{ position: "relative", flexShrink: 0 }}>
              <div style={{ width: 72, height: 72, borderRadius: 18, overflow: "hidden", background: member.role === "decideur" ? C.amber : C.teal, display: "grid", placeItems: "center" }}>
                {member.avatar
                  ? <img src={member.avatar} alt={member.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : <span style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 700, color: "#fff", fontSize: 30 }}>{initial}</span>}
              </div>
              {member.role === "decideur" && (
                <span style={{ position: "absolute", top: -8, right: -8, background: C.amber, borderRadius: "50%", width: 26, height: 26, display: "grid", placeItems: "center", border: "3px solid #fff", boxShadow: "0 2px 5px rgba(0,0,0,.2)" }} title="Membre décisionnaire">
                  <Crown size={14} color="#fff" />
                </span>
              )}
              {isChildAccount(member) && (
                <span style={{ position: "absolute", bottom: -8, right: -8, background: "#fff", borderRadius: "50%", width: 27, height: 27, display: "grid", placeItems: "center", border: `2.5px solid ${C.purple}`, boxShadow: "0 2px 5px rgba(0,0,0,.2)" }} title={`Compte enfant (moins de ${CHILD_AGE_LIMIT} ans)`}>
                  <PacifierIcon size={15} />
                </span>
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <span style={{ fontSize: 13, color: member.role === "decideur" ? C.amber : C.teal, fontWeight: 700, fontFamily: "'Fredoka',sans-serif" }}>
                  {member.role === "decideur" ? "Membre décisionnaire" : "Membre non décisionnaire"}
                </span>
                {isChildAccount(member) && (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12.5, fontWeight: 700, fontFamily: "'Fredoka',sans-serif", color: C.purple, background: "rgba(107,58,122,.12)", borderRadius: 999, padding: "3px 10px" }}>
                    <PacifierIcon size={12} /> Compte enfant
                  </span>
                )}
                {currentUser?.admin && member.id !== currentUser.id && (
                  <button onClick={() => setEditOpen(true)} title={`Modifier le profil de ${member.name}`}
                    style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12.5, fontWeight: 700, fontFamily: "'Fredoka',sans-serif", color: C.purple, background: "rgba(107,58,122,.12)", border: `1px solid ${C.purple}44`, borderRadius: 999, padding: "3px 10px", cursor: "pointer" }}>
                    <Pencil size={11} /> Modifier
                  </button>
                )}
                {member.city && <span style={{ fontSize: 13, color: "#8a7c6a", display: "inline-flex", alignItems: "center", gap: 3 }}><MapPin size={13} /> {member.city}</span>}
                {birthdayLabel(member) && (() => {
                  const j = daysUntilBirthday(member);
                  const age = memberAge(member);
                  const soon = j != null && j <= 30;
                  return (
                    <span title={j === 0 ? "C'est aujourd'hui !" : `Dans ${j} jour${j > 1 ? "s" : ""}`}
                      style={{ fontSize: 13, color: soon ? C.amber : "#8a7c6a", fontWeight: soon ? 700 : 400, display: "inline-flex", alignItems: "center", gap: 4 }}>
                      🎂 {birthdayLabel(member)}
                      {age != null && <span style={{ color: "#9c8d79", fontWeight: 400 }}>· {age} ans</span>}
                      {j === 0 && <span style={{ color: C.amber, fontWeight: 700 }}>· c'est aujourd'hui !</span>}
                    </span>
                  );
                })()}
              </div>
              {/* liens externes */}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
                {safeUrl(member.bggUrl) && <a href={safeUrl(member.bggUrl)} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12.5, color: "#fff", background: "#ff5100", padding: "4px 10px", borderRadius: 8, textDecoration: "none", fontFamily: "'Fredoka',sans-serif", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 4 }}><ExternalLink size={12} /> BGG</a>}
                {safeUrl(member.okkazeoUrl) && <a href={safeUrl(member.okkazeoUrl)} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12.5, color: "#fff", background: C.purple, padding: "4px 10px", borderRadius: 8, textDecoration: "none", fontFamily: "'Fredoka',sans-serif", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 4 }}><ExternalLink size={12} /> Okkazeo</a>}
              </div>
              {/* mécaniques préférées */}
              {member.favMechanics && member.favMechanics.length > 0 && (
                <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: 10 }}>
                  <span style={{ fontSize: 12, color: "#9c8d79", alignSelf: "center" }}>Aime :</span>
                  {member.favMechanics.map((m, i) => <Badge key={i} color={C.purple}>{m}</Badge>)}
                </div>
              )}
              {member.hatedMechanics && member.hatedMechanics.length > 0 && (
                <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: 8 }}>
                  <span style={{ fontSize: 12, color: "#9c8d79", alignSelf: "center" }}>Ne veut pas jouer :</span>
                  {member.hatedMechanics.map((m, i) => <Badge key={i} color={C.red}>{m}</Badge>)}
                </div>
              )}
              <MemberBadgesRow member={member} data={{ plays, events, games, upcoming, beltByGame }} />
              {member.favColors && member.favColors.length > 0 && (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginTop: 10 }}>
                  <span style={{ fontSize: 12, color: "#9c8d79" }}>Couleurs préférées :</span>
                  {member.favColors.map(colorByKey).filter(Boolean).map((c, i) => (
                    <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12.5, color: C.navy, fontWeight: 600 }}>
                      <span style={{ width: 15, height: 15, borderRadius: "50%", background: c.hex, border: "1px solid rgba(0,0,0,.15)" }} /> {i + 1}. {c.label}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
          {/* encart de présentation */}
          {member.bio && (
            <div style={{ background: "rgba(26,58,92,.04)", borderRadius: 12, padding: "12px 14px", fontSize: 14, color: "#5e5346", lineHeight: 1.55, whiteSpace: "pre-line" }}>{member.bio}</div>
          )}
        </div>
      )}

      {theirTop.length > 0 && (
        <>
          <h4 style={{ fontFamily: "'Fredoka',sans-serif", color: C.navy, fontSize: 15, margin: "0 0 12px", borderTop: "1px solid #f0e8d8", paddingTop: 16 }}>
            💎 Son top 10 ever <span style={{ fontWeight: 400, fontSize: 12.5, color: "#9c8d79" }}>· les jeux qu'il garderait s'il ne restait qu'eux</span>
          </h4>
          <div style={{ marginBottom: 18 }}><Top10List ids={theirTop} onOpenGame={setGameOpen} /></div>
        </>
      )}

      {/* Top 10 des jeux les plus joués (historique des parties enregistrées) */}
      {theirMostPlayed.length > 0 && (
        <>
          <h4 style={{ fontFamily: "'Fredoka',sans-serif", color: C.navy, fontSize: 15, margin: "0 0 12px", borderTop: "1px solid #f0e8d8", paddingTop: 16 }}>
            🎲 Ses jeux les plus joués <span style={{ fontWeight: 400, fontSize: 12.5, color: "#9c8d79" }}>· d'après ses parties enregistrées</span>
          </h4>
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr)", gap: 6, marginBottom: 18 }}>
            {theirMostPlayed.map((e, i) => (
              <button key={e.gameId} type="button" onClick={() => setGameOpen(e.gameId)} title={`Ouvrir la fiche de ${e.game.name}`}
                style={{ display: "flex", alignItems: "center", gap: 10, background: "#fff", border: "1px solid #efe6d6", borderRadius: 11, padding: "7px 11px", cursor: "pointer", textAlign: "left", width: "100%", minWidth: 0, font: "inherit" }}
                onMouseEnter={(ev) => ev.currentTarget.style.background = "rgba(30,138,138,.06)"} onMouseLeave={(ev) => ev.currentTarget.style.background = "#fff"}>
                <span style={{ width: 20, flexShrink: 0, textAlign: "right", color: "#c3b49b", fontFamily: "'Fredoka',sans-serif", fontWeight: 700, fontSize: 13 }}>{i + 1}</span>
                <span style={{ width: 34, height: 34, borderRadius: 8, flexShrink: 0, background: e.game.img ? `center/cover url("${e.game.img}")` : `linear-gradient(135deg,${C.teal},${C.navy})` }} />
                <span style={{ flex: 1, minWidth: 0, fontFamily: "'Fredoka',sans-serif", fontWeight: 600, color: C.navy, fontSize: 14, lineHeight: 1.25, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.game.name}</span>
                {e.wins > 0 && <span title={`${e.wins} victoire${e.wins > 1 ? "s" : ""}`} style={{ flexShrink: 0, color: C.amber, fontWeight: 700, fontSize: 12.5 }}>🏆 {e.wins}</span>}
                <span style={{ flexShrink: 0, display: "inline-flex", alignItems: "baseline", gap: 4, background: "rgba(30,138,138,.12)", color: C.teal, borderRadius: 999, padding: "3px 10px", fontFamily: "'Fredoka',sans-serif", fontWeight: 700, fontSize: 13 }}>
                  {e.count}<span style={{ fontSize: 10.5, fontWeight: 600 }}>partie{e.count > 1 ? "s" : ""}</span>
                </span>
              </button>
            ))}
          </div>
        </>
      )}

      <h4 style={{ fontFamily: "'Fredoka',sans-serif", color: C.navy, fontSize: 15, margin: "0 0 12px", borderTop: "1px solid #f0e8d8", paddingTop: 16 }}>
        Sa ludothèque ({theirGames.length}{theirExtCount > 0 ? ` + ${theirExtCount} ${theirExtCount > 1 ? "extensions" : "extension"}` : ""}) <span style={{ fontWeight: 400, fontSize: 12.5, color: "#9c8d79" }}>· classée par ses notes</span>
      </h4>
      {famNames.length > 0 && (
        <p style={{ margin: "-4px 0 12px", fontSize: 13, color: "#8a7c6a" }}>
          👨‍👩‍👧 Partage une ludothèque familiale avec <b style={{ color: C.navy }}>{famNames.join(", ")}</b>.
        </p>
      )}
      {theirGames.length === 0 && famGames.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 20px", color: "#a89a86" }}>
          <Gamepad2 size={40} style={{ opacity: .4, marginBottom: 12 }} />
          <p style={{ fontSize: 14.5 }}>Ce membre n'a pas encore ajouté de jeu.</p>
        </div>
      ) : theirGames.length === 0 ? (
        <p style={{ margin: "0 0 4px", fontSize: 13.5, color: "#6e6256" }}>Ce membre n'a pas de jeu à son nom, mais il joue avec la <b>ludothèque familiale</b> ci-dessous.</p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 14, maxHeight: "55vh", overflowY: "auto", padding: 2 }}>
          {theirGames.map((g) => {
            const myRating = g.ratings?.[memberId] || 0;
            return (
              <div key={g.id} style={{ borderRadius: 14, overflow: "hidden", border: "1px solid #efe6d6", background: "#fff" }}>
                <div style={{ position: "relative" }}>
                  <GameCover g={g} />
                  {myRating > 0 && (
                    <div style={{ position: "absolute", top: 8, right: 8, background: "rgba(232,163,23,.95)", color: "#fff", borderRadius: 999, padding: "3px 9px", fontFamily: "'Fredoka',sans-serif", fontWeight: 700, fontSize: 12, display: "flex", alignItems: "center", gap: 3 }}>
                      <Star size={11} fill="#fff" color="#fff" /> {String(myRating).replace(".", ",")}
                    </div>
                  )}
                </div>
                <div style={{ padding: "10px 12px" }}>
                  <div style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 600, color: C.navy, fontSize: 14, lineHeight: 1.2 }}>{g.name}</div>
                  <div style={{ fontSize: 12, color: "#9c8d79", marginTop: 4, display: "flex", gap: 8 }}>
                    {g.min && <span>{g.min}{g.max && g.max !== g.min ? `-${g.max}` : ""} j.</span>}
                    {g.time && <span>{g.time} min</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Ludothèque familiale : les jeux des autres membres du foyer, en petites vignettes */}
      {famGames.length > 0 && (
        <>
          <h4 style={{ fontFamily: "'Fredoka',sans-serif", color: C.navy, fontSize: 15, margin: "18px 0 4px", borderTop: "1px solid #f0e8d8", paddingTop: 16 }}>
            👨‍👩‍👧 Sa ludothèque familiale ({famGames.length}) <span style={{ fontWeight: 400, fontSize: 12.5, color: "#9c8d79" }}>· les jeux {famNames.length === 1 ? "de " + famNames[0] : "de son foyer"}</span>
          </h4>
          <p style={{ margin: "0 0 10px", fontSize: 12.5, color: "#9c8d79" }}>Ces jeux ne sont pas à son nom, mais il y a accès au quotidien.</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 10, maxHeight: "40vh", overflowY: "auto", padding: 2 }}>
            {famGames.map((g) => (
              <button key={g.id} type="button" onClick={() => setGameOpen(g.id)} title={`Ouvrir la fiche de ${g.name}`}
                style={{ display: "flex", alignItems: "center", gap: 9, background: "#fff", border: "1px solid #ece2d0", borderRadius: 12, padding: "7px 9px", cursor: "pointer", textAlign: "left", minWidth: 0, font: "inherit" }}
                onMouseEnter={(ev) => ev.currentTarget.style.background = "rgba(30,138,138,.06)"} onMouseLeave={(ev) => ev.currentTarget.style.background = "#fff"}>
                <div style={{ width: 38, height: 38, borderRadius: 8, flexShrink: 0, background: g.img ? `center/cover url("${g.img}")` : `linear-gradient(135deg,${C.teal},${C.navy})` }} />
                <span style={{ flex: 1, minWidth: 0, fontFamily: "'Fredoka',sans-serif", fontWeight: 600, fontSize: 12.5, color: C.navy, lineHeight: 1.2, overflowWrap: "anywhere" }}>{g.name}</span>
              </button>
            ))}
          </div>
        </>
      )}

      {/* Fiche de jeu ouverte depuis l'un des blocs ci-dessus */}
      {gameOpen && (() => {
        const gg = games.find((g) => g.id === gameOpen);
        return gg ? <GameDetailModal g={gg} onClose={() => setGameOpen(null)} onAuth={onAuth} setToast={setToast} /> : null;
      })()}
      {editOpen && member && <ProfileEditModal member={member} onClose={() => setEditOpen(false)} />}
    </Modal>
  );
}

/* =============================================================================
   ESPACE DECISIONNAIRE
   Reserve aux membres decisionnaires : c'est la qu'on partage les idees et
   qu'on tranche. Deux volets :
     * la boite a idees (proposer, soutenir, discuter) ;
     * les votes en ligne (choix multiples, quorum, date limite).

   Les donnees sont chargees a la demande par cette page, et non au demarrage
   du site : inutile de les transporter pour les membres qui n'y ont pas acces.
   ============================================================================= */

// Un vote est-il termine ? (cloture anticipee, ou date limite depassee)
function isPollClosed(p) {
  if (!p) return true;
  if (p.closed_at) return true;
  return !!p.closes_at && Date.now() > new Date(p.closes_at).getTime();
}

// Temps restant avant la fermeture, en clair.
function pollTimeLeft(p) {
  if (!p || !p.closes_at) return "";
  const ms = new Date(p.closes_at).getTime() - Date.now();
  if (ms <= 0) return "terminé";
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `${mins} min restantes`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} h restantes`;
  const days = Math.floor(hours / 24);
  return `${days} jour${days > 1 ? "s" : ""} restant${days > 1 ? "s" : ""}`;
}

function DeciderPage({ setToast }) {
  const { currentUser } = useApp();
  const [tab, setTab] = useState("idees");
  if (!isDecideur(currentUser)) {
    return (
      <div style={{ maxWidth: 700, margin: "0 auto", padding: "60px 24px" }}>
        <EmptyHint icon={Crown} text="Cet espace est réservé aux membres décisionnaires." />
      </div>
    );
  }
  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "40px 24px 80px" }}>
      <div style={{ marginBottom: 22 }}>
        <span style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 700, color: C.amber, fontSize: 13, textTransform: "uppercase", letterSpacing: "0.12em", display: "flex", alignItems: "center", gap: 6 }}>
          <Crown size={15} color={C.amber} /> Espace réservé
        </span>
        <h1 style={{ fontFamily: "'Fredoka',sans-serif", color: C.navy, fontSize: "clamp(28px,5vw,42px)", margin: "4px 0 0", letterSpacing: "-0.02em" }}>Décisionnaire</h1>
        <p style={{ margin: "8px 0 0", fontSize: 14.5, color: "#6e6256", lineHeight: 1.6, maxWidth: 640 }}>
          L'endroit où l'on partage les idées et où l'on tranche, entre membres décisionnaires.
          Ce que vous écrivez ici n'est visible que d'eux.
        </p>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
        {[
          { k: "idees", t: "\ud83d\udca1 Boîte à idées" },
          { k: "votes", t: "\ud83d\uddf3️ Votes" },
        ].map((x) => (
          <button key={x.k} type="button" onClick={() => setTab(x.k)}
            style={{ padding: "10px 20px", borderRadius: 12, cursor: "pointer", border: "none", fontFamily: "'Fredoka',sans-serif", fontWeight: 700, fontSize: 15,
              background: tab === x.k ? C.navy : "rgba(26,58,92,.07)", color: tab === x.k ? "#fff" : C.navy }}>
            {x.t}
          </button>
        ))}
      </div>

      {tab === "idees" ? <IdeaBox setToast={setToast} /> : <PollBoard setToast={setToast} />}
    </div>
  );
}

/* ---- Boite a idees --------------------------------------------------------- */
function IdeaBox({ setToast }) {
  const { currentUser, users, askConfirm } = useApp();
  const [ideas, setIdeas] = useState(null);
  const [supports, setSupports] = useState([]);
  const [comments, setComments] = useState([]);
  const [err, setErr] = useState("");
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({ title: "", content: "" });
  const [busy, setBusy] = useState(false);
  const [openId, setOpenId] = useState(null);
  const [showArchived, setShowArchived] = useState(false);
  // Modification d'une idee : son auteur ou un administrateur peuvent la corriger.
  const [editId, setEditId] = useState(null);
  const [editDraft, setEditDraft] = useState({ title: "", content: "" });

  const load = useCallback(async () => {
    const [a, b, c] = await Promise.all([
      supabase.from("decider_ideas").select("*").order("created_at", { ascending: false }),
      supabase.from("decider_idea_supports").select("idea_id,user_id"),
      supabase.from("decider_idea_comments").select("*").order("created_at", { ascending: true }),
    ]);
    if (a.error) { setErr(a.error.message); setIdeas([]); return; }
    setIdeas(a.data || []);
    setSupports(b.data || []);
    setComments(c.data || []);
  }, []);
  useEffect(() => { load(); }, [load]);

  const nameOf = (id) => (users || []).find((u) => u.id === id)?.name || "Un membre";
  const supportsOf = (id) => supports.filter((x) => x.idea_id === id);
  const iSupport = (id) => supports.some((x) => x.idea_id === id && x.user_id === currentUser?.id);
  const commentsOf = (id) => comments.filter((c) => c.idea_id === id);

  const submit = async () => {
    const t = draft.title.trim();
    if (!t) return;
    setBusy(true); setErr("");
    const { error } = await supabase.from("decider_ideas").insert({
      author_id: currentUser.id, title: t.slice(0, 200), content: draft.content.trim().slice(0, 4000),
    });
    setBusy(false);
    if (error) { setErr(error.message); return; }
    setDraft({ title: "", content: "" }); setAdding(false);
    await load();
    if (setToast) setToast("Idée ajoutée à la boîte.");
  };

  const toggleSupport = async (id) => {
    if (iSupport(id)) {
      await supabase.from("decider_idea_supports").delete().eq("idea_id", id).eq("user_id", currentUser.id);
    } else {
      await supabase.from("decider_idea_supports").insert({ idea_id: id, user_id: currentUser.id });
    }
    await load();
  };

  const startEdit = (idea) => { setEditId(idea.id); setEditDraft({ title: idea.title, content: idea.content || "" }); };

  const saveEdit = async () => {
    const t = editDraft.title.trim();
    if (!t) return;
    setBusy(true); setErr("");
    const { error } = await supabase.from("decider_ideas").update({
      title: t.slice(0, 200), content: editDraft.content.trim().slice(0, 4000), updated_at: new Date().toISOString(),
    }).eq("id", editId);
    setBusy(false);
    if (error) { setErr(error.message); return; }
    setEditId(null);
    await load();
    if (setToast) setToast("Idée modifiée.");
  };

  const setStatus = async (idea, status) => {
    await supabase.from("decider_ideas").update({ status, updated_at: new Date().toISOString() }).eq("id", idea.id);
    await load();
  };

  const removeIdea = async (idea) => {
    if (!(await askConfirm({
      title: "Supprimer cette idée ?",
      message: "L'idée et tous ses commentaires seront supprimés pour tous les membres décisionnaires.",
      confirmLabel: "Supprimer",
    }))) return;
    const { error } = await supabase.from("decider_ideas").delete().eq("id", idea.id);
    if (error) { setErr(error.message); return; }
    await load();
  };

  const visible = (ideas || []).filter((i) => showArchived ? true : i.status !== "archived");
  const archivedCount = (ideas || []).filter((i) => i.status === "archived").length;

  return (
    <div>
      {err && <div style={{ background: "rgba(181,40,58,.1)", color: C.red, padding: "10px 14px", borderRadius: 11, fontSize: 13, fontWeight: 600, marginBottom: 14 }}>{err}</div>}

      {!adding ? (
        <Btn variant="amber" onClick={() => setAdding(true)} style={{ marginBottom: 20 }}><Plus size={17} /> Proposer une idée</Btn>
      ) : (
        <div style={{ background: C.paper, border: "1px solid #ece2d0", borderRadius: 16, padding: 18, marginBottom: 20 }}>
          <Field label="L'idée en une phrase"><TextInput value={draft.title} maxLength={200} autoFocus placeholder="Ex. : organiser un week-end jeux en septembre" onChange={(e) => setDraft({ ...draft, title: e.target.value })} /></Field>
          <Field label="Détails" hint="Facultatif — le contexte, les contraintes, ce qu'il faudrait décider.">
            <textarea rows={4} value={draft.content} maxLength={4000} onChange={(e) => setDraft({ ...draft, content: e.target.value })} style={{ ...inputStyle, resize: "vertical" }} />
          </Field>
          <div style={{ display: "flex", gap: 8 }}>
            <Btn variant="teal" onClick={submit} disabled={busy || !draft.title.trim()}>
              {busy ? <Loader2 size={15} className="aladj-spin" /> : <><Check size={15} /> Publier</>}
            </Btn>
            <Btn variant="soft" onClick={() => { setAdding(false); setDraft({ title: "", content: "" }); }}>Annuler</Btn>
          </div>
        </div>
      )}

      {ideas === null ? (
        <div style={{ color: "#a89a86", fontSize: 14, display: "flex", alignItems: "center", gap: 8 }}><Loader2 size={16} className="aladj-spin" /> Chargement…</div>
      ) : visible.length === 0 ? (
        <EmptyHint icon={Sparkles} text="La boîte à idées est vide. Lancez la première !" />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr)", gap: 12 }}>
          {visible.map((idea) => {
            const sup = supportsOf(idea.id);
            const mine = idea.author_id === currentUser?.id;
            const canTouch = mine || currentUser?.admin;
            const cs = commentsOf(idea.id);
            const isOpen = openId === idea.id;
            const done = idea.status === "done";
            const archived = idea.status === "archived";
            return (
              <div key={idea.id} style={{ background: C.paper, border: `1px solid ${done ? "rgba(30,138,138,.35)" : "#ece2d0"}`, borderRadius: 16, padding: "16px 18px", opacity: archived ? .6 : 1 }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
                  <button type="button" onClick={() => toggleSupport(idea.id)} title={iSupport(idea.id) ? "Retirer mon soutien" : "Je soutiens cette idée"}
                    style={{ flexShrink: 0, display: "grid", placeItems: "center", width: 46, padding: "6px 0", borderRadius: 11, cursor: "pointer",
                      border: `1.5px solid ${iSupport(idea.id) ? C.amber : "#e6dcc9"}`, background: iSupport(idea.id) ? "rgba(232,163,23,.12)" : "#fff" }}>
                    <ThumbsUp size={15} color={iSupport(idea.id) ? C.amber : "#b6a78f"} />
                    <span style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 700, fontSize: 13, color: iSupport(idea.id) ? C.amber : "#8a7c6a", marginTop: 2 }}>{sup.length}</span>
                  </button>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {editId === idea.id ? (
                      <div>
                        <Field label="L'idée en une phrase"><TextInput value={editDraft.title} maxLength={200} autoFocus onChange={(e) => setEditDraft({ ...editDraft, title: e.target.value })} /></Field>
                        <Field label="Détails">
                          <textarea rows={4} value={editDraft.content} maxLength={4000} onChange={(e) => setEditDraft({ ...editDraft, content: e.target.value })} style={{ ...inputStyle, resize: "vertical" }} />
                        </Field>
                        <div style={{ display: "flex", gap: 8 }}>
                          <Btn size="sm" variant="teal" onClick={saveEdit} disabled={busy || !editDraft.title.trim()}><Check size={14} /> Enregistrer</Btn>
                          <Btn size="sm" variant="soft" onClick={() => setEditId(null)}>Annuler</Btn>
                        </div>
                      </div>
                    ) : (
                    <>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 700, color: C.navy, fontSize: 16.5, overflowWrap: "anywhere" }}>{idea.title}</span>
                      {done && <span style={{ fontSize: 11, fontWeight: 700, color: "#fff", background: C.teal, borderRadius: 999, padding: "2px 9px", fontFamily: "'Fredoka',sans-serif" }}>TRANCHÉE</span>}
                      {archived && <span style={{ fontSize: 11, fontWeight: 700, color: "#fff", background: "#9c8d79", borderRadius: 999, padding: "2px 9px", fontFamily: "'Fredoka',sans-serif" }}>ARCHIVÉE</span>}
                    </div>
                    <div style={{ fontSize: 12, color: "#9c8d79", marginTop: 3, display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap" }}>
                      <span>par {mine ? "vous" : nameOf(idea.author_id)}</span>
                      <DeciderCrownFor id={idea.author_id} size={11} />
                      <span>· {new Date(idea.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</span>
                      {idea.updated_at && <span style={{ fontStyle: "italic" }}>(modifiée)</span>}
                    </div>
                    {idea.content && (
                      <p style={{ margin: "9px 0 0", fontSize: 14, color: "#5e5346", lineHeight: 1.55, whiteSpace: "pre-line", overflowWrap: "anywhere" }}>{idea.content}</p>
                    )}
                    <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
                      <Btn size="sm" variant="soft" onClick={() => setOpenId(isOpen ? null : idea.id)}>
                        <MessageCircle size={14} /> {cs.length > 0 ? `${cs.length} commentaire${cs.length > 1 ? "s" : ""}` : "Commenter"}
                      </Btn>
                      {canTouch && <Btn size="sm" variant="soft" onClick={() => startEdit(idea)}><Edit3 size={14} /> Modifier</Btn>}
                      {canTouch && !done && <Btn size="sm" variant="soft" onClick={() => setStatus(idea, "done")}><Check size={14} /> Marquer tranchée</Btn>}
                      {canTouch && done && <Btn size="sm" variant="soft" onClick={() => setStatus(idea, "open")}>Rouvrir</Btn>}
                      {canTouch && !archived && <Btn size="sm" variant="soft" onClick={() => setStatus(idea, "archived")}>Archiver</Btn>}
                      {canTouch && archived && <Btn size="sm" variant="soft" onClick={() => setStatus(idea, "open")}>Désarchiver</Btn>}
                      {canTouch && <Btn size="sm" variant="danger" onClick={() => removeIdea(idea)}><Trash2 size={14} /></Btn>}
                    </div>
                    {isOpen && <IdeaComments ideaId={idea.id} rows={cs} onChange={load} nameOf={nameOf} />}
                    </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {archivedCount > 0 && (
        <button type="button" onClick={() => setShowArchived((v) => !v)}
          style={{ marginTop: 18, background: "none", border: "none", color: C.teal, fontSize: 13, textDecoration: "underline", textUnderlineOffset: 2, cursor: "pointer", fontFamily: "'Nunito',sans-serif", padding: 0 }}>
          {showArchived ? "Masquer" : "Afficher"} les {archivedCount} idée{archivedCount > 1 ? "s" : ""} archivée{archivedCount > 1 ? "s" : ""}
        </button>
      )}
    </div>
  );
}

/* ---- Commentaires d'une idee ---------------------------------------------- */
function IdeaComments({ ideaId, rows, onChange, nameOf }) {
  const { currentUser, askConfirm } = useApp();
  const reacts = useReactions("idea", (rows || []).map((c) => c.id));
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editText, setEditText] = useState("");

  const saveEdit = async () => {
    const t = editText.trim();
    if (!t) return;
    setBusy(true);
    await supabase.from("decider_idea_comments")
      .update({ content: t.slice(0, 2000), updated_at: new Date().toISOString() }).eq("id", editId);
    setBusy(false); setEditId(null); setEditText("");
    await onChange();
  };

  const send = async () => {
    const t = text.trim();
    if (!t) return;
    setBusy(true);
    await supabase.from("decider_idea_comments").insert({ idea_id: ideaId, author_id: currentUser.id, content: t.slice(0, 2000) });
    setBusy(false); setText("");
    await onChange();
  };

  const remove = async (c) => {
    if (!(await askConfirm({ title: "Supprimer ce commentaire ?", message: "Il sera retiré de la discussion.", confirmLabel: "Supprimer" }))) return;
    await supabase.from("decider_idea_comments").delete().eq("id", c.id);
    await onChange();
  };

  return (
    <div style={{ marginTop: 14, borderTop: "1px solid #f0e8d8", paddingTop: 12 }}>
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr)", gap: 8, marginBottom: 10 }}>
        {rows.length === 0 && <span style={{ fontSize: 13, color: "#a89a86" }}>Aucun commentaire pour l'instant.</span>}
        {rows.map((c) => (
          <div key={c.id} style={{ display: "flex", gap: 9, alignItems: "flex-start", background: "rgba(26,58,92,.04)", borderRadius: 11, padding: "9px 12px" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, color: "#9c8d79", marginBottom: 2, display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap" }}>
                <b style={{ color: C.navy, fontFamily: "'Fredoka',sans-serif" }}>{c.author_id === currentUser?.id ? "Vous" : nameOf(c.author_id)}</b>
                <DeciderCrownFor id={c.author_id} size={11} />
                <span>· {new Date(c.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}</span>
              </div>
              {editId === c.id ? (
                <div>
                  <textarea value={editText} onChange={(e) => setEditText(e.target.value)} rows={2} maxLength={2000} style={{ ...inputStyle, resize: "vertical", marginBottom: 7 }} />
                  <div style={{ display: "flex", gap: 7 }}>
                    <Btn size="sm" variant="teal" onClick={saveEdit} disabled={busy || !editText.trim()}>Enregistrer</Btn>
                    <Btn size="sm" variant="soft" onClick={() => { setEditId(null); setEditText(""); }}>Annuler</Btn>
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: 14, color: "#5e5346", lineHeight: 1.5, whiteSpace: "pre-line", overflowWrap: "anywhere" }}>
                  {c.content}
                  {c.updated_at && <span style={{ fontSize: 11.5, color: "#9c8d79", fontStyle: "italic" }}> (modifié)</span>}
                  <CommentReactions commentId={c.id} rows={reacts.rows} onReact={reacts.react} compact />
                </div>
              )}
            </div>
            {(c.author_id === currentUser?.id || currentUser?.admin) && editId !== c.id && (
              <div style={{ display: "flex", gap: 9, flexShrink: 0 }}>
                <button onClick={() => { setEditId(c.id); setEditText(c.content); }} title="Modifier" style={{ background: "none", border: "none", cursor: "pointer", color: "#9c8d79", padding: 0 }}><Edit3 size={14} /></button>
                <button onClick={() => remove(c)} title="Supprimer" style={{ background: "none", border: "none", cursor: "pointer", color: C.red, padding: 0 }}><Trash2 size={14} /></button>
              </div>
            )}
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={1} maxLength={2000} placeholder="Votre avis sur cette idée…" style={{ ...inputStyle, resize: "vertical", flex: 1 }} />
        <Btn size="sm" variant="teal" onClick={send} disabled={busy || !text.trim()}>Envoyer</Btn>
      </div>
    </div>
  );
}

/* ---- Votes ----------------------------------------------------------------- */
function PollBoard({ setToast }) {
  const { currentUser, users, askConfirm } = useApp();
  const [polls, setPolls] = useState(null);
  const [options, setOptions] = useState([]);
  const [myVotes, setMyVotes] = useState([]);
  const [status, setStatus] = useState({});     // poll_id -> { voter_count, is_closed }
  const [results, setResults] = useState({});   // poll_id -> [{ option_id, votes }]
  const [comments, setComments] = useState([]); // commentaires de tous les votes
  const [err, setErr] = useState("");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(null);   // vote en cours de modification

  const load = useCallback(async () => {
    const [p, o, v, st, cm] = await Promise.all([
      supabase.from("polls").select("*").order("created_at", { ascending: false }),
      supabase.from("poll_options").select("*").order("sort_order", { ascending: true }),
      supabase.from("poll_votes").select("poll_id,option_id").eq("voter_id", currentUser.id),
      supabase.rpc("aladj_poll_status"),
      supabase.from("poll_comments").select("*").order("created_at", { ascending: true }),
    ]);
    if (p.error) { setErr(p.error.message); setPolls([]); return; }
    setPolls(p.data || []);
    setOptions(o.data || []);
    setMyVotes(v.data || []);
    setComments(cm.data || []);
    const map = {};
    (st.data || []).forEach((r) => { map[r.poll_id] = { voterCount: r.voter_count, isClosed: r.is_closed }; });
    setStatus(map);

    // Resultats : seulement pour les votes clos (ou pour un administrateur).
    const wanted = (p.data || []).filter((x) => isPollClosed(x) || currentUser.admin);
    const res = {};
    await Promise.all(wanted.map(async (x) => {
      const { data } = await supabase.rpc("aladj_poll_results", { p_poll_id: x.id });
      if (data) res[x.id] = data;
    }));
    setResults(res);
  }, [currentUser]);
  useEffect(() => { load(); }, [load]);

  const removePoll = async (p) => {
    if (!(await askConfirm({
      title: "Supprimer ce vote ?", message: "Le vote, ses options et tous les bulletins seront supprimés. Action définitive.", confirmLabel: "Supprimer",
    }))) return;
    const { error } = await supabase.from("polls").delete().eq("id", p.id);
    if (error) { setErr(error.message); return; }
    await load();
  };

  const closeNow = async (p) => {
    if (!(await askConfirm({
      title: "Clore ce vote maintenant ?", message: "Plus personne ne pourra voter, et les résultats deviendront visibles de tous les membres décisionnaires.", confirmLabel: "Clore le vote",
    }))) return;
    await supabase.from("polls").update({ closed_at: new Date().toISOString() }).eq("id", p.id);
    await load();
  };

  const open = (polls || []).filter((p) => !isPollClosed(p));
  const closed = (polls || []).filter((p) => isPollClosed(p));

  return (
    <div>
      {err && <div style={{ background: "rgba(181,40,58,.1)", color: C.red, padding: "10px 14px", borderRadius: 11, fontSize: 13, fontWeight: 600, marginBottom: 14 }}>{err}</div>}

      <Btn variant="amber" onClick={() => setCreating(true)} style={{ marginBottom: 20 }}><Plus size={17} /> Lancer un vote</Btn>

      {polls === null ? (
        <div style={{ color: "#a89a86", fontSize: 14, display: "flex", alignItems: "center", gap: 8 }}><Loader2 size={16} className="aladj-spin" /> Chargement…</div>
      ) : polls.length === 0 ? (
        <EmptyHint icon={Crown} text="Aucun vote pour l'instant." />
      ) : (
        <>
          {open.length > 0 && (
            <>
              <h3 style={{ fontFamily: "'Fredoka',sans-serif", color: C.navy, fontSize: 17, margin: "0 0 12px" }}>En cours ({open.length})</h3>
              <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr)", gap: 14, marginBottom: 26 }}>
                {open.map((p) => (
                  <PollCard key={p.id} poll={p} options={options.filter((o) => o.poll_id === p.id)}
                    myOptionIds={myVotes.filter((v) => v.poll_id === p.id).map((v) => v.option_id)}
                    st={status[p.id]} result={results[p.id]} users={users}
                    comments={comments.filter((c) => c.poll_id === p.id)}
                    onChanged={load} onRemove={removePoll} onClose={closeNow} onEdit={setEditing} setToast={setToast} />
                ))}
              </div>
            </>
          )}
          {closed.length > 0 && (
            <>
              <h3 style={{ fontFamily: "'Fredoka',sans-serif", color: C.navy, fontSize: 17, margin: "0 0 12px" }}>Terminés ({closed.length})</h3>
              <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr)", gap: 14 }}>
                {closed.map((p) => (
                  <PollCard key={p.id} poll={p} options={options.filter((o) => o.poll_id === p.id)}
                    myOptionIds={myVotes.filter((v) => v.poll_id === p.id).map((v) => v.option_id)}
                    st={status[p.id]} result={results[p.id]} users={users}
                    comments={comments.filter((c) => c.poll_id === p.id)}
                    onChanged={load} onRemove={removePoll} onClose={closeNow} onEdit={setEditing} setToast={setToast} />
                ))}
              </div>
            </>
          )}
        </>
      )}

      {creating && <PollFormModal onClose={() => setCreating(false)} onDone={async () => { setCreating(false); await load(); if (setToast) setToast("Vote lancé — les décisionnaires sont prévenus."); }} />}
      {editing && (
        <PollFormModal
          poll={editing}
          options={options.filter((o) => o.poll_id === editing.id)}
          voterCount={status[editing.id]?.voterCount ?? 0}
          onClose={() => setEditing(null)}
          onDone={async () => { setEditing(null); await load(); if (setToast) setToast("Vote modifié."); }}
        />
      )}
    </div>
  );
}

/* ---- Une carte de vote ----------------------------------------------------- */
function PollCard({ poll, options, myOptionIds, st, result, users, comments = [], onChanged, onRemove, onClose, onEdit, setToast }) {
  const { currentUser } = useApp();
  const [sel, setSel] = useState(myOptionIds);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  useEffect(() => { setSel(myOptionIds); }, [myOptionIds.join("|")]); // eslint-disable-line

  const closedNow = isPollClosed(poll);
  const mine = poll.author_id === currentUser?.id;
  const canManage = mine || currentUser?.admin;
  const voterCount = st?.voterCount ?? 0;
  const quorumOk = voterCount >= (poll.min_voters || 1);
  const iVoted = myOptionIds.length > 0;
  const authorName = (users || []).find((u) => u.id === poll.author_id)?.name || "Un membre";

  // Les resultats ne sont charges que si le vote est clos, ou si l'on est
  // administrateur : le serveur refuse purement et simplement les autres cas.
  // MAIS tant que le vote est ouvert, le bulletin reste prioritaire : un
  // administrateur doit pouvoir voter comme tout le monde dans un vote en cours.
  const showResults = !!result && closedNow;
  const canPeek = !!result && !closedNow;   // resultats provisoires (administrateurs)
  const [peek, setPeek] = useState(false);
  // Zone de discussion : depliee d'office quand il y a deja des commentaires,
  // pour qu'un argument deja ecrit ne passe pas inapercu avant de voter.
  const [showComments, setShowComments] = useState(comments.length > 0);
  const totalVotes = (result || []).reduce((s, r) => s + (r.votes || 0), 0);
  const maxVotes = Math.max(1, ...(result || []).map((r) => r.votes || 0));

  const toggle = (id) => {
    setErr("");
    if (poll.multi) {
      setSel((arr) => arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id]);
    } else {
      setSel((arr) => arr.includes(id) ? [] : [id]);
    }
  };

  const send = async () => {
    setBusy(true); setErr("");
    const { error } = await supabase.rpc("aladj_cast_vote", { p_poll_id: poll.id, p_option_ids: sel });
    setBusy(false);
    if (error) {
      const m = error.message || "";
      setErr(/ALADJ_POLL_CLOSED/.test(m) ? "Ce vote est clôturé : il n'est plus possible de voter."
        : /ALADJ_TOO_MANY_CHOICES/.test(m) ? `Vous ne pouvez choisir que ${poll.max_choices} réponse${poll.max_choices > 1 ? "s" : ""} au maximum.`
        : /ALADJ_SINGLE_CHOICE/.test(m) ? "Ce vote n'accepte qu'une seule réponse."
        : /ALADJ_NOT_DECIDEUR/.test(m) ? "Seuls les membres décisionnaires peuvent voter."
        : m);
      return;
    }
    await onChanged();
    if (setToast) setToast(sel.length === 0 ? "Votre vote a été retiré." : "Vote enregistré.");
  };

  const dirty = sel.slice().sort().join("|") !== myOptionIds.slice().sort().join("|");

  return (
    <div style={{ background: C.paper, border: `1px solid ${closedNow ? "#ece2d0" : "rgba(232,163,23,.45)"}`, borderRadius: 16, padding: "18px 20px" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 6 }}>
        <span style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 700, color: C.navy, fontSize: 18, minWidth: 0, overflowWrap: "anywhere" }}>{poll.question}</span>
        <span style={{ flexShrink: 0, fontSize: 11.5, fontWeight: 700, fontFamily: "'Fredoka',sans-serif", borderRadius: 999, padding: "3px 11px",
          background: closedNow ? "rgba(26,58,92,.08)" : "rgba(232,163,23,.16)", color: closedNow ? "#8a7c6a" : "#8a6a1f" }}>
          {closedNow ? "TERMINÉ" : pollTimeLeft(poll).toUpperCase()}
        </span>
      </div>

      <div style={{ fontSize: 12.5, color: "#9c8d79", marginBottom: 12, display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap" }}>
        <span>proposé par {mine ? "vous" : authorName}</span>
        <span>· {poll.multi ? (poll.max_choices ? `plusieurs réponses (max. ${poll.max_choices})` : "plusieurs réponses possibles") : "une seule réponse"}</span>
        <span>· clôture le {new Date(poll.closes_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })} à {new Date(poll.closes_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</span>
      </div>

      {poll.description && (
        <p style={{ margin: "0 0 14px", fontSize: 14, color: "#5e5346", lineHeight: 1.55, whiteSpace: "pre-line", overflowWrap: "anywhere" }}>{poll.description}</p>
      )}

      {/* Participation et quorum */}
      <div style={{ display: "flex", alignItems: "center", gap: 9, background: quorumOk ? "rgba(30,138,138,.08)" : "rgba(232,163,23,.1)", borderRadius: 11, padding: "9px 13px", marginBottom: 14, fontSize: 13, color: quorumOk ? C.teal : "#8a6a1f", fontWeight: 600 }}>
        <Users size={15} style={{ flexShrink: 0 }} />
        <span>
          <b>{voterCount}</b> votant{voterCount > 1 ? "s" : ""} · quorum de <b>{poll.min_voters}</b> {quorumOk ? "atteint" : `— il en manque ${poll.min_voters - voterCount}`}
        </span>
      </div>

      {err && <div style={{ background: "rgba(181,40,58,.1)", color: C.red, padding: "9px 12px", borderRadius: 10, fontSize: 13, fontWeight: 600, marginBottom: 12 }}>{err}</div>}

      {/* Bulletin ou resultats */}
      {showResults ? (
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr)", gap: 9 }}>
          {(result || []).map((r) => {
            const pct = totalVotes > 0 ? Math.round((r.votes / totalVotes) * 100) : 0;
            const isMine = myOptionIds.includes(r.option_id);
            const isTop = r.votes === maxVotes && r.votes > 0;
            return (
              <div key={r.option_id}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10, marginBottom: 3, fontSize: 14 }}>
                  <span style={{ color: "#5e5346", minWidth: 0, overflowWrap: "anywhere" }}>
                    {r.label}{isMine ? <b style={{ color: C.teal }}> · votre choix</b> : ""}
                  </span>
                  <span style={{ flexShrink: 0, fontFamily: "'Fredoka',sans-serif", fontWeight: 700, color: isTop ? C.amber : C.navy }}>
                    {r.votes} <span style={{ fontSize: 12, fontWeight: 600, color: "#9c8d79" }}>({pct} %)</span>
                  </span>
                </div>
                <div style={{ height: 12, background: "#eee4d2", borderRadius: 99, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${totalVotes > 0 ? (r.votes / maxVotes) * 100 : 0}%`, background: isTop ? C.amber : C.teal, borderRadius: 99, transition: "width .3s" }} />
                </div>
              </div>
            );
          })}
          {totalVotes === 0 && <span style={{ fontSize: 13.5, color: "#a89a86" }}>Personne n'a voté.</span>}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr)", gap: 8 }}>
          {options.map((o) => {
            const on = sel.includes(o.id);
            return (
              <button key={o.id} type="button" onClick={() => !closedNow && toggle(o.id)} disabled={closedNow}
                style={{ display: "flex", gap: 11, alignItems: "center", padding: "11px 14px", borderRadius: 11, cursor: closedNow ? "default" : "pointer", textAlign: "left",
                  border: `2px solid ${on ? C.teal : "#e6dcc9"}`, background: on ? "rgba(30,138,138,.07)" : "#fff", font: "inherit", minWidth: 0 }}>
                <span style={{ width: 19, height: 19, borderRadius: poll.multi ? 5 : "50%", border: `2px solid ${on ? C.teal : "#c5b69c"}`, flexShrink: 0, display: "grid", placeItems: "center" }}>
                  {on && (poll.multi
                    ? <Check size={12} color={C.teal} />
                    : <span style={{ width: 9, height: 9, borderRadius: "50%", background: C.teal }} />)}
                </span>
                <span style={{ fontSize: 14.5, color: C.navy, minWidth: 0, overflowWrap: "anywhere" }}>{o.label}</span>
              </button>
            );
          })}
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginTop: 4 }}>
            <Btn size="sm" variant="teal" onClick={send} disabled={busy || closedNow || !dirty}>
              {busy ? <Loader2 size={14} className="aladj-spin" /> : <><Check size={14} /> {iVoted ? "Modifier mon vote" : "Voter"}</>}
            </Btn>
            {iVoted && !closedNow && (
              <span style={{ fontSize: 12.5, color: C.teal, fontWeight: 600 }}>
                Vote enregistré — modifiable jusqu'à la clôture.
              </span>
            )}
            {!iVoted && <span style={{ fontSize: 12.5, color: "#9c8d79" }}>Les résultats seront révélés à la clôture.</span>}
          </div>

          {/* Resultats provisoires : reserves aux administrateurs, replies par
              defaut pour ne pas influencer son propre vote. */}
          {canPeek && (
            <div style={{ marginTop: 6, borderTop: "1px dashed #e6dcc9", paddingTop: 10 }}>
              <button type="button" onClick={() => setPeek((v) => !v)}
                style={{ background: "none", border: "none", padding: 0, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontFamily: "'Fredoka',sans-serif", fontWeight: 700, fontSize: 12.5, color: C.purple }}>
                <Eye size={13} /> {peek ? "Masquer" : "Voir"} les résultats provisoires
                <span style={{ fontWeight: 400, color: "#9c8d79" }}>· administrateurs uniquement</span>
              </button>
              {peek && (
                <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr)", gap: 8, marginTop: 10 }}>
                  {(result || []).map((r) => {
                    const tot = (result || []).reduce((a, b) => a + (b.votes || 0), 0);
                    const mx = Math.max(1, ...(result || []).map((x) => x.votes || 0));
                    const pct = tot > 0 ? Math.round((r.votes / tot) * 100) : 0;
                    return (
                      <div key={r.option_id}>
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, fontSize: 13, marginBottom: 3 }}>
                          <span style={{ color: "#5e5346", minWidth: 0, overflowWrap: "anywhere" }}>{r.label}</span>
                          <span style={{ flexShrink: 0, fontFamily: "'Fredoka',sans-serif", fontWeight: 700, color: C.purple }}>{r.votes} <span style={{ fontSize: 11.5, fontWeight: 600, color: "#9c8d79" }}>({pct} %)</span></span>
                        </div>
                        <div style={{ height: 9, background: "#eee4d2", borderRadius: 99, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${tot > 0 ? (r.votes / mx) * 100 : 0}%`, background: C.purple, borderRadius: 99 }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Discussion : on argumente avant (et apres) le scrutin. Les commentaires
          sont visibles de tous les decisionnaires, jamais des autres membres. */}
      <div style={{ marginTop: 14, borderTop: "1px solid #f0e8d8", paddingTop: 12 }}>
        <Btn size="sm" variant="soft" onClick={() => setShowComments((v) => !v)}>
          <MessageCircle size={14} /> {comments.length > 0 ? `${comments.length} commentaire${comments.length > 1 ? "s" : ""}` : "Commenter ce vote"}
        </Btn>
        {showComments && <PollComments pollId={poll.id} rows={comments} users={users} onChange={onChanged} closedNow={closedNow} />}
      </div>

      {canManage && (
        <div style={{ display: "flex", gap: 8, marginTop: 14, borderTop: "1px solid #f0e8d8", paddingTop: 12, flexWrap: "wrap" }}>
          {!closedNow && <Btn size="sm" variant="soft" onClick={() => onEdit(poll)}><Edit3 size={14} /> Modifier</Btn>}
          {!closedNow && <Btn size="sm" variant="soft" onClick={() => onClose(poll)}><Lock size={14} /> Clore maintenant</Btn>}
          <Btn size="sm" variant="danger" onClick={() => onRemove(poll)}><Trash2 size={14} /> Supprimer</Btn>
        </div>
      )}
    </div>
  );
}

/* ---- Commentaires d'un vote ------------------------------------------------
   Meme fonctionnement que les commentaires d'idees : l'auteur (et les
   administrateurs) peuvent corriger ou retirer. Une difference : l'insertion
   declenche cote base une notification pour TOUS les decisionnaires, afin que
   personne ne rate un argument depose la veille de la cloture.
   --------------------------------------------------------------------------- */
function PollComments({ pollId, rows, users, onChange, closedNow }) {
  const { currentUser, askConfirm } = useApp();
  const reacts = useReactions("poll", (rows || []).map((c) => c.id));
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [editId, setEditId] = useState(null);
  const [editText, setEditText] = useState("");

  const nameOf = (id) => (users || []).find((u) => u.id === id)?.name || "Un membre";

  const send = async () => {
    const t = text.trim();
    if (!t) return;
    setBusy(true); setErr("");
    const { error } = await supabase.from("poll_comments").insert({ poll_id: pollId, author_id: currentUser.id, content: t.slice(0, 2000) });
    setBusy(false);
    if (error) { setErr(error.message); return; }
    setText("");
    await onChange();
  };

  const saveEdit = async () => {
    const t = editText.trim();
    if (!t) return;
    setBusy(true); setErr("");
    const { error } = await supabase.from("poll_comments")
      .update({ content: t.slice(0, 2000), updated_at: new Date().toISOString() }).eq("id", editId);
    setBusy(false);
    if (error) { setErr(error.message); return; }
    setEditId(null); setEditText("");
    await onChange();
  };

  const remove = async (c) => {
    if (!(await askConfirm({ title: "Supprimer ce commentaire ?", message: "Il sera retire de la discussion pour tous les decisionnaires.", confirmLabel: "Supprimer" }))) return;
    await supabase.from("poll_comments").delete().eq("id", c.id);
    await onChange();
  };

  return (
    <div style={{ marginTop: 12 }}>
      {err && <div style={{ background: "rgba(181,40,58,.1)", color: C.red, padding: "9px 12px", borderRadius: 10, fontSize: 13, fontWeight: 600, marginBottom: 10 }}>{err}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr)", gap: 8, marginBottom: 10 }}>
        {rows.length === 0 && (
          <span style={{ fontSize: 13, color: "#a89a86" }}>
            {closedNow ? "Aucun commentaire sur ce vote." : "Aucun commentaire pour l'instant — lancez la discussion avant la clôture."}
          </span>
        )}
        {rows.map((c) => (
          <div key={c.id} style={{ display: "flex", gap: 9, alignItems: "flex-start", background: "rgba(26,58,92,.04)", borderRadius: 11, padding: "9px 12px" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, color: "#9c8d79", marginBottom: 2, display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap" }}>
                <b style={{ color: C.navy, fontFamily: "'Fredoka',sans-serif" }}>{c.author_id === currentUser?.id ? "Vous" : nameOf(c.author_id)}</b>
                <DeciderCrownFor id={c.author_id} size={11} />
                <span>· {new Date(c.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}</span>
              </div>
              {editId === c.id ? (
                <div>
                  <textarea value={editText} onChange={(e) => setEditText(e.target.value)} rows={2} maxLength={2000} style={{ ...inputStyle, resize: "vertical", marginBottom: 7 }} />
                  <div style={{ display: "flex", gap: 7 }}>
                    <Btn size="sm" variant="teal" onClick={saveEdit} disabled={busy || !editText.trim()}>Enregistrer</Btn>
                    <Btn size="sm" variant="soft" onClick={() => { setEditId(null); setEditText(""); }}>Annuler</Btn>
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: 14, color: "#5e5346", lineHeight: 1.5, whiteSpace: "pre-line", overflowWrap: "anywhere" }}>
                  {c.content}
                  {c.updated_at && <span style={{ fontSize: 11.5, color: "#9c8d79", fontStyle: "italic" }}> (modifié)</span>}
                  <CommentReactions commentId={c.id} rows={reacts.rows} onReact={reacts.react} compact />
                </div>
              )}
            </div>
            {(c.author_id === currentUser?.id || currentUser?.admin) && editId !== c.id && (
              <div style={{ display: "flex", gap: 9, flexShrink: 0 }}>
                <button onClick={() => { setEditId(c.id); setEditText(c.content); }} title="Modifier" style={{ background: "none", border: "none", cursor: "pointer", color: "#9c8d79", padding: 0 }}><Edit3 size={14} /></button>
                <button onClick={() => remove(c)} title="Supprimer" style={{ background: "none", border: "none", cursor: "pointer", color: C.red, padding: 0 }}><Trash2 size={14} /></button>
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={1} maxLength={2000}
          placeholder={closedNow ? "Un mot sur le résultat…" : "Votre argument, une précision, une objection…"}
          style={{ ...inputStyle, resize: "vertical", flex: 1 }} />
        <Btn size="sm" variant="teal" onClick={send} disabled={busy || !text.trim()}>
          {busy ? <Loader2 size={14} className="aladj-spin" /> : "Envoyer"}
        </Btn>
      </div>
      <p style={{ margin: "7px 0 0", fontSize: 11.5, color: "#a89a86" }}>
        Tous les membres décisionnaires reçoivent une notification. Votre bulletin, lui, reste secret.
      </p>
    </div>
  );
}

/* ---- Creation ET modification d'un vote ------------------------------------
   Un seul formulaire pour les deux usages : les regles de validation ne
   peuvent pas diverger entre la creation et la correction.
   Une fois qu'au moins une personne a vote, la structure du scrutin est gelee
   (nombre de reponses, mono/multi) : la modifier fausserait les bulletins deja
   deposes. Les libelles, eux, restent corrigeables -- une faute de frappe ne
   change pas le sens d'un vote.
   --------------------------------------------------------------------------- */
function PollFormModal({ poll = null, options = [], voterCount = 0, onClose, onDone }) {
  const { currentUser } = useApp();
  const editMode = !!poll;
  const frozen = editMode && voterCount > 0;   // structure gelee : des bulletins existent
  const today = new Date().toISOString().slice(0, 10);
  const inAWeek = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
  const closeD = poll ? new Date(poll.closes_at) : null;
  const [f, setF] = useState({
    question: poll ? poll.question : "",
    description: poll ? (poll.description || "") : "",
    multi: poll ? !!poll.multi : false,
    maxChoices: poll && poll.max_choices ? String(poll.max_choices) : "",
    minVoters: poll ? poll.min_voters : 2,
    closeDate: closeD ? `${closeD.getFullYear()}-${String(closeD.getMonth() + 1).padStart(2, "0")}-${String(closeD.getDate()).padStart(2, "0")}` : inAWeek,
    closeTime: closeD ? `${String(closeD.getHours()).padStart(2, "0")}:${String(closeD.getMinutes()).padStart(2, "0")}` : "20:00",
  });
  // Chaque reponse garde son identifiant : c'est lui qui rattache les bulletins.
  const [opts, setOpts] = useState(
    editMode && options.length
      ? options.slice().sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)).map((o) => ({ id: o.id, label: o.label }))
      : [{ id: null, label: "" }, { id: null, label: "" }]
  );
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const setOpt = (i, v) => setOpts((a) => a.map((x, j) => j === i ? { ...x, label: v } : x));
  const addOpt = () => setOpts((a) => a.length >= 12 ? a : [...a, { id: null, label: "" }]);
  const delOpt = (i) => setOpts((a) => a.length <= 2 ? a : a.filter((_, j) => j !== i));

  const submit = async () => {
    setErr("");
    const q = f.question.trim();
    const kept = opts.map((o) => ({ id: o.id, label: o.label.trim() })).filter((o) => o.label);
    const labels = kept.map((o) => o.label);
    if (!q) { setErr("Formulez la question soumise au vote."); return; }
    if (kept.length < 2) { setErr("Il faut au moins deux réponses possibles."); return; }
    if (new Set(labels.map((c) => c.toLowerCase())).size !== labels.length) { setErr("Deux réponses sont identiques."); return; }
    const closesAt = new Date(`${f.closeDate}T${f.closeTime}:00`);
    if (isNaN(closesAt.getTime())) { setErr("Date limite invalide."); return; }
    if (closesAt.getTime() <= Date.now()) { setErr("La date limite doit être dans le futur."); return; }
    const minV = Math.max(1, parseInt(f.minVoters, 10) || 1);
    const maxC = f.multi && f.maxChoices ? Math.max(1, parseInt(f.maxChoices, 10)) : null;
    if (maxC && maxC > kept.length) { setErr("Le nombre maximum de choix dépasse le nombre de réponses."); return; }

    setBusy(true);

    // ---- Modification d'un vote existant -----------------------------------
    if (editMode) {
      const patch = { question: q.slice(0, 300), description: f.description.trim().slice(0, 4000), min_voters: minV, closes_at: closesAt.toISOString() };
      if (!frozen) { patch.multi = !!f.multi; patch.max_choices = maxC; }
      const { error } = await supabase.from("polls").update(patch).eq("id", poll.id);
      if (error) { setBusy(false); setErr(error.message); return; }

      // libelles corriges
      for (const o of kept.filter((x) => x.id)) {
        const before = options.find((x) => x.id === o.id);
        if (before && before.label !== o.label) {
          await supabase.from("poll_options").update({ label: o.label.slice(0, 200) }).eq("id", o.id);
        }
      }
      if (!frozen) {
        const removed = options.filter((o) => !kept.some((k) => k.id === o.id));
        if (removed.length) await supabase.from("poll_options").delete().in("id", removed.map((o) => o.id));
        const added = kept.filter((o) => !o.id);
        if (added.length) {
          const { error: aErr } = await supabase.from("poll_options")
            .insert(added.map((o, i) => ({ poll_id: poll.id, label: o.label.slice(0, 200), sort_order: options.length + i })));
          if (aErr) { setBusy(false); setErr(aErr.message); return; }
        }
      }
      // ordre d'affichage remis a plat
      for (let i = 0; i < kept.length; i++) {
        if (kept[i].id) await supabase.from("poll_options").update({ sort_order: i }).eq("id", kept[i].id);
      }
      setBusy(false);
      await onDone();
      return;
    }

    // ---- Creation ----------------------------------------------------------
    const { data, error } = await supabase.from("polls").insert({
      author_id: currentUser.id, question: q.slice(0, 300), description: f.description.trim().slice(0, 4000),
      multi: !!f.multi, max_choices: maxC, min_voters: minV, closes_at: closesAt.toISOString(),
    }).select().single();
    if (error) { setBusy(false); setErr(error.message); return; }

    const { error: oErr } = await supabase.from("poll_options")
      .insert(labels.map((label, i) => ({ poll_id: data.id, label: label.slice(0, 200), sort_order: i })));
    setBusy(false);
    if (oErr) {
      // Un vote sans reponse n'a aucun sens : on annule tout plutot que de
      // laisser un vote inutilisable derriere nous.
      await supabase.from("polls").delete().eq("id", data.id);
      setErr(oErr.message);
      return;
    }
    await onDone();
  };

  return (
    <Modal open onClose={onClose} title={editMode ? "✏️ Modifier le vote" : "🗳️ Lancer un vote"} width={580}>
      {err && <div style={{ background: "rgba(181,40,58,.1)", color: C.red, padding: "10px 14px", borderRadius: 11, fontSize: 13, fontWeight: 600, marginBottom: 14 }}>{err}</div>}
      {frozen && (
        <div style={{ display: "flex", alignItems: "flex-start", gap: 9, background: "rgba(232,163,23,.11)", borderRadius: 11, padding: "10px 13px", marginBottom: 16 }}>
          <Info size={16} color={C.amber} style={{ flexShrink: 0, marginTop: 2 }} />
          <span style={{ fontSize: 13, color: "#5e5346", lineHeight: 1.55 }}>
            <b>{voterCount} personne{voterCount > 1 ? "s ont" : " a"} déjà voté.</b> Vous pouvez corriger les textes, le quorum et la date limite, mais plus <b>ajouter ni retirer de réponse</b>, ni changer le mode de scrutin : cela fausserait les bulletins déjà déposés.
          </span>
        </div>
      )}

      <Field label="La question soumise au vote">
        <TextInput value={f.question} maxLength={300} autoFocus placeholder="Ex. : quelle date pour l'assemblée générale ?" onChange={(e) => setF({ ...f, question: e.target.value })} />
      </Field>
      <Field label="Précisions" hint="Facultatif — le contexte, les conséquences de chaque option.">
        <textarea rows={3} value={f.description} maxLength={4000} onChange={(e) => setF({ ...f, description: e.target.value })} style={{ ...inputStyle, resize: "vertical" }} />
      </Field>

      <Field label="Les réponses possibles" hint="Deux au minimum, douze au maximum.">
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr)", gap: 7 }}>
          {opts.map((o, i) => (
            <div key={i} style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ width: 20, flexShrink: 0, color: "#c3b49b", fontFamily: "'Fredoka',sans-serif", fontWeight: 700, fontSize: 13, textAlign: "right" }}>{i + 1}</span>
              <TextInput value={o.label} maxLength={200} placeholder={`Réponse ${i + 1}`} onChange={(e) => setOpt(i, e.target.value)} style={{ flex: 1 }} />
              {opts.length > 2 && !frozen && (
                <button onClick={() => delOpt(i)} title="Retirer cette réponse" style={{ background: "none", border: "none", cursor: "pointer", color: C.red, flexShrink: 0, padding: 0 }}><X size={16} /></button>
              )}
            </div>
          ))}
        </div>
        {opts.length < 12 && !frozen && <Btn size="sm" variant="soft" onClick={addOpt} style={{ marginTop: 9 }}><Plus size={14} /> Ajouter une réponse</Btn>}
      </Field>

      <label style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "11px 14px", borderRadius: 12, background: f.multi ? "rgba(30,138,138,.1)" : "rgba(26,58,92,.05)", border: `1.5px solid ${f.multi ? C.teal : "transparent"}`, marginBottom: 14, cursor: "pointer" }}>
        <input type="checkbox" checked={f.multi} disabled={frozen} onChange={(e) => setF({ ...f, multi: e.target.checked, maxChoices: "" })} style={{ width: 18, height: 18, accentColor: C.teal, marginTop: 2, flexShrink: 0 }} />
        <span style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 600, color: C.navy, fontSize: 14 }}>
          Autoriser plusieurs réponses
          <span style={{ display: "block", fontSize: 12.5, color: "#8a7c6a", fontWeight: 400, lineHeight: 1.5, marginTop: 3 }}>
            Chaque votant pourra cocher plusieurs cases. Sinon, une seule réponse par personne.
          </span>
        </span>
      </label>

      <div style={{ display: "grid", gridTemplateColumns: f.multi ? "1fr 1fr" : "minmax(0,1fr)", gap: 14 }}>
        <Field label="Votants requis (quorum)" hint="Le vote reste valable en deçà, mais l'écart est signalé.">
          <TextInput type="number" min="1" value={f.minVoters} onChange={(e) => setF({ ...f, minVoters: e.target.value })} />
        </Field>
        {f.multi && (
          <Field label="Choix maximum" hint="Laissez vide pour ne pas limiter.">
            <TextInput type="number" min="1" value={f.maxChoices} onChange={(e) => setF({ ...f, maxChoices: e.target.value })} placeholder="illimité" />
          </Field>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <Field label="Clôture le"><TextInput type="date" min={today} value={f.closeDate} onChange={(e) => setF({ ...f, closeDate: e.target.value })} /></Field>
        <Field label="à"><TextInput type="time" value={f.closeTime} onChange={(e) => setF({ ...f, closeTime: e.target.value })} /></Field>
      </div>

      <div style={{ display: editMode ? "none" : "flex", alignItems: "flex-start", gap: 9, background: "rgba(107,58,122,.07)", borderRadius: 11, padding: "10px 13px", marginBottom: 16 }}>
        <Info size={16} color={C.purple} style={{ flexShrink: 0, marginTop: 2 }} />
        <span style={{ fontSize: 13, color: "#5e5346", lineHeight: 1.55 }}>
          Les résultats resteront <b>invisibles jusqu'à la clôture</b> : chacun ne voit que son propre bulletin, et peut le modifier jusqu'au dernier moment. Seuls les administrateurs y ont accès en cours de route. Tous les décisionnaires seront prévenus de l'ouverture du vote.
        </span>
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <Btn variant="teal" onClick={submit} disabled={busy}>
          {busy ? <Loader2 size={15} className="aladj-spin" /> : <><Check size={15} /> {editMode ? "Enregistrer" : "Lancer le vote"}</>}
        </Btn>
        <Btn variant="soft" onClick={onClose}>Annuler</Btn>
      </div>
    </Modal>
  );
}

function SectionTitle({ kicker, title, noMargin }) {
  return (
    <div style={{ textAlign: "center", marginBottom: noMargin ? 0 : 0 }}>
      <span style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 700, color: C.teal, fontSize: 13, textTransform: "uppercase", letterSpacing: "0.12em" }}>{kicker}</span>
      <h2 style={{ fontFamily: "'Fredoka',sans-serif", color: C.navy, fontSize: "clamp(28px,4vw,40px)", margin: "6px 0 0", letterSpacing: "-0.02em" }}>{title}</h2>
    </div>
  );
}

function PlanCard({ color, title, price, period, features, cta, onCta, crown }) {
  return (
    <div style={{ background: C.paper, borderRadius: 24, padding: 32, border: `2px solid ${color}`, position: "relative", boxShadow: "0 8px 30px rgba(18,41,63,.07)" }}>
      {crown && <div style={{ position: "absolute", top: -14, right: 24, background: color, color: C.navyDeep, padding: "5px 14px", borderRadius: 999, fontFamily: "'Fredoka',sans-serif", fontWeight: 700, fontSize: 12.5, display: "flex", alignItems: "center", gap: 5 }}><Crown size={14} /> Décide de l'asso</div>}
      <h3 style={{ fontFamily: "'Fredoka',sans-serif", color: C.navy, fontSize: 22, margin: "0 0 10px" }}>{title}</h3>
      <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 22 }}>
        <span style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 700, fontSize: 44, color }}>{price}</span>
        <span style={{ color: "#8a7c6a", fontSize: 16 }}>{period}</span>
      </div>
      <ul style={{ listStyle: "none", padding: 0, margin: "0 0 24px", display: "grid", gridTemplateColumns: "minmax(0,1fr)", gap: 11 }}>
        {features.map((f, i) => (
          <li key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", color: "#5e5346", fontSize: 14.5, lineHeight: 1.4 }}>
            <span style={{ marginTop: 1, color }}><Check size={18} /></span> {f}
          </li>
        ))}
      </ul>
      {cta && <Btn full size="lg" onClick={onCta} style={{ background: color, border: `2px solid ${color}`, color: crown ? C.navyDeep : "#fff" }}>{cta} <ChevronRight size={18} /></Btn>}
    </div>
  );
}

function EmptyHint({ icon: Icon, text }) {
  return (
    <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "48px 20px", color: "#a89a86", background: "rgba(26,58,92,.03)", borderRadius: 18, border: "2px dashed #e0d4bf" }}>
      <Icon size={40} style={{ opacity: .5 }} />
      <p style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 600, marginTop: 12, fontSize: 16 }}>{text}</p>
    </div>
  );
}

/* =============================================================================
   CARTES SOIRÉE
   ============================================================================= */
function EventCardMini({ e, onOpen }) {
  const { currentUser } = useApp();
  const filled = e.players.length + (e.guests?.length || 0);
  const reached = filled >= e.min;
  const dimmed = isEventDimmed(e, currentUser);
  // Couleurs cohérentes avec le calendrier : en ligne (BGA) => violet/ambre, présentiel => teal/rouge
  const accent = e.online ? (reached ? C.purple : C.amber) : (reached ? C.teal : C.red);
  const headerGrad = e.online
    ? (reached ? `linear-gradient(135deg,${C.purple},#4a2856)` : `linear-gradient(135deg,${C.amber},#b07d10)`)
    : (reached ? `linear-gradient(135deg,${C.teal},#16706f)` : `linear-gradient(135deg,${C.red},#8e1f2e)`);
  return (
    <button onClick={onOpen} style={{
      textAlign: "left", cursor: "pointer", borderRadius: 20, overflow: "hidden", padding: 0,
      background: C.paper, boxShadow: "0 4px 18px rgba(18,41,63,.06)", border: "1px solid #ece2d0",
    }}>
      <div style={{ background: headerGrad, padding: "16px 20px", color: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 12.5, opacity: .85, fontFamily: "'Fredoka',sans-serif", fontWeight: 600 }}>{formatDateShort(e.date)} · {e.time}</div>
          <div style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 700, fontSize: 18 }}>{FR_DAYS[new Date(e.date + "T00:00:00").getDay()]}</div>
        </div>
        <Badge color="#fff" soft={false}>{reached ? <><Check size={13} /> Confirmée</> : "En attente"}</Badge>
      </div>
      {e.isPrivate && (
        <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 20px", background: dimmed ? "rgba(120,110,95,.14)" : "rgba(107,58,122,.1)", fontSize: 12.5, fontFamily: "'Fredoka',sans-serif", fontWeight: 600, color: dimmed ? "#6b6250" : C.purple }}>
          <Lock size={13} /> {dimmed ? "Moment privé — vous le voyez en tant qu'administrateur" : "Moment privé — sur invitation"}
        </div>
      )}
      <div style={{ padding: 20, opacity: dimmed ? 0.72 : 1 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center", color: C.navy, fontWeight: 600, fontFamily: "'Fredoka',sans-serif", marginBottom: 10 }}>
          {e.online ? <Globe size={16} color={accent} /> : <MapPin size={16} color={accent} />} {currentUser ? e.place : <i style={{ color: "#9c8d79", fontWeight: 500 }}>Lieu réservé aux membres connectés</i>}
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", color: "#6e6256", fontSize: 14 }}>
          <Users size={16} color={accent} />
          <b style={{ color: accent }}>{filled}</b> joueur{filled > 1 ? "s" : ""} · min {e.min}{e.max ? ` / max ${e.max}` : " · sans limite"}
        </div>
        <div style={{ marginTop: 12, height: 7, borderRadius: 99, background: "#eee4d2", overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${e.max ? Math.min(100, (filled / e.max) * 100) : (reached ? 100 : (filled / Math.max(e.min, 1)) * 100)}%`, background: accent, transition: "width .4s" }} />
        </div>
        <div style={{ fontSize: 12.5, color: "#9c8d79", marginTop: 8 }}>Proposée par {e.hostName}</div>
      </div>
    </button>
  );
}

/* =============================================================================
   PAGE — SOIRÉES (calendrier + création + fond rouge/vert)
   ============================================================================= */
/* ---- Abonnement au calendrier (flux iCal) ---- */
function CalendarSubscribeModal({ onClose, setToast }) {
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(CALENDAR_FEED_URL);
      setToast("Lien du calendrier copié !");
    } catch (e) {
      // Repli pour les navigateurs sans accès presse-papiers
      const ta = document.createElement("textarea");
      ta.value = CALENDAR_FEED_URL; document.body.appendChild(ta);
      ta.select(); document.execCommand("copy"); document.body.removeChild(ta);
      setToast("Lien du calendrier copié !");
    }
  };
  const stepStyle = { fontSize: 13.5, color: "#5e5346", lineHeight: 1.6, margin: "0 0 4px" };
  return (
    <Modal open onClose={onClose} title="S'abonner au calendrier" width={560}>
      <p style={{ fontSize: 14, color: "#6e6256", lineHeight: 1.55, margin: "0 0 14px" }}>
        Ajoutez les moments jeux directement dans votre agenda personnel : les soirées (et leurs modifications) apparaîtront automatiquement, sans rien faire. Les soirées « en attente » de joueurs sont marquées comme provisoires.
      </p>
      <div style={{ display: "flex", gap: 8, alignItems: "center", background: "#fff", border: "1.5px solid #e6dcc9", borderRadius: 11, padding: "9px 12px", marginBottom: 16 }}>
        <span style={{ flex: 1, fontSize: 12.5, color: C.navy, wordBreak: "break-all", fontFamily: "monospace" }}>{CALENDAR_FEED_URL}</span>
        <Btn size="sm" variant="teal" onClick={copy}><Copy size={13} /> Copier</Btn>
      </div>
      <div style={{ background: "rgba(30,138,138,.06)", borderRadius: 12, padding: "12px 15px", marginBottom: 10 }}>
        <div style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 700, color: C.navy, fontSize: 14, marginBottom: 4 }}>Google Agenda</div>
        <p style={stepStyle}>Sur ordinateur : calendar.google.com → à gauche, « Autres agendas » → <b>+</b> → « À partir de l'URL » → collez le lien. Le calendrier apparaîtra ensuite aussi dans l'application sur téléphone.</p>
      </div>
      <div style={{ background: "rgba(107,58,122,.06)", borderRadius: 12, padding: "12px 15px", marginBottom: 10 }}>
        <div style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 700, color: C.navy, fontSize: 14, marginBottom: 4 }}>iPhone / iPad</div>
        <p style={stepStyle}>Réglages → Calendrier → Comptes → Ajouter un compte → Autre → « Ajouter un cal. avec abonnement » → collez le lien.</p>
      </div>
      <p style={{ fontSize: 12.5, color: "#9c8d79", margin: 0 }}>Les agendas se mettent à jour automatiquement (comptez quelques heures de délai selon l'application). Ce lien est réservé aux membres : inutile de le diffuser en dehors de l'association.</p>
    </Modal>
  );
}

function EventsPage({ onAuth, setToast }) {
  const { events, currentUser, users, addEvent, toggleJoin, removeEvent } = useApp();
  const [showCreate, setShowCreate] = useState(false);
  const [presetDate, setPresetDate] = useState(null); // date pré-remplie au clic sur le calendrier
  const [justCreated, setJustCreated] = useState(null); // moment tout juste créé → proposer le partage Signal
  const [selected, setSelected] = useState(null);
  const [dayPicker, setDayPicker] = useState(null);
  const [birthdayDay, setBirthdayDay] = useState(null); // { iso, members, past }
  const [birthdayMember, setBirthdayMember] = useState(null); // fiche ouverte depuis la liste // plusieurs moments le même jour → fenêtre de choix
  const [calSub, setCalSub] = useState(false); // fenêtre « s'abonner au calendrier »
  const [monthCursor, setMonthCursor] = useState(() => { const d = new Date(); return { y: d.getFullYear(), m: d.getMonth() }; });

  // Les moments privés ne sont visibles que par les membres conviés (et, en grisé, par les admins).
  const visibleEvents = useMemo(() => events.filter((e) => canViewEvent(e, currentUser)), [events, currentUser]);

  const sorted = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    // Les moments annulés (quorum non atteint) restent visibles, en noir.
    return [...visibleEvents].filter((e) => e.date >= today).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  }, [visibleEvents]);

  const selectedEvent = visibleEvents.find((e) => e.id === selected);
  // (le rendu du modal d'abonnement est ajouté en bas de page)

  // grille calendrier
  const cal = useMemo(() => {
    const { y, m } = monthCursor;
    const first = new Date(y, m, 1);
    const startDay = (first.getDay() + 6) % 7; // lundi = 0
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < startDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      const iso = `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      cells.push({ d, iso, events: visibleEvents.filter((e) => e.date === iso) });
    }
    return cells;
  }, [monthCursor, visibleEvents]);

  return (
    <div style={{ maxWidth: 1180, margin: "0 auto", padding: "40px 24px 80px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 14, marginBottom: 30 }}>
        <div>
          <span style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 700, color: C.teal, fontSize: 13, textTransform: "uppercase", letterSpacing: "0.12em" }}>Agenda</span>
          <h1 style={{ fontFamily: "'Fredoka',sans-serif", color: C.navy, fontSize: "clamp(30px,5vw,44px)", margin: "4px 0 0", letterSpacing: "-0.02em" }}>Les moments jeux</h1>
        </div>
        {currentUser
          ? <Btn variant="amber" size="lg" onClick={() => setShowCreate(true)}><Plus size={18} /> Proposer un moment jeux</Btn>
          : <Btn variant="ghost" onClick={() => onAuth("login")}><LogIn size={16} /> Connectez-vous pour proposer</Btn>}
      </div>

      {/* CALENDRIER */}
      <div style={{ background: C.paper, borderRadius: 22, border: "1px solid #ece2d0", padding: "20px 22px", marginBottom: 36, boxShadow: "0 4px 18px rgba(18,41,63,.05)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <button onClick={() => setMonthCursor((c) => { const m = c.m - 1; return m < 0 ? { y: c.y - 1, m: 11 } : { ...c, m }; })} style={navBtnStyle}><ChevronRight size={18} style={{ transform: "rotate(180deg)" }} /></button>
          <h3 style={{ fontFamily: "'Fredoka',sans-serif", color: C.navy, fontSize: 21, margin: 0, textTransform: "capitalize" }}>{FR_MONTHS[monthCursor.m]} {monthCursor.y}</h3>
          <button onClick={() => setMonthCursor((c) => { const m = c.m + 1; return m > 11 ? { y: c.y + 1, m: 0 } : { ...c, m }; })} style={navBtnStyle}><ChevronRight size={18} /></button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,minmax(0,1fr))", gap: 6 }} className="aladj-cal-grid">
          {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((d) => (
            <div key={d} style={{ textAlign: "center", fontFamily: "'Fredoka',sans-serif", fontWeight: 700, color: "#a89a86", fontSize: 12.5, padding: "4px 0", minWidth: 0 }}>{d}</div>
          ))}
          {cal.map((cell, i) => {
            if (!cell) return <div key={i} style={{ minWidth: 0 }} />;
            const isToday = cell.iso === new Date().toISOString().slice(0, 10);
            const todayIso = new Date().toISOString().slice(0, 10);
            const isPast = cell.iso < todayIso;
            const hasEv = cell.events.length > 0;
            const cellBirthdays = birthdayMembersOn(cell.iso, users);
            // clic : sur un événement → ouvre sa fiche ; sur un anniversaire seul → dit
            // de qui il s'agit (l'infobulle du gateau est invisible au doigt) ;
            // sur case vide future → propose de créer un moment à cette date.
            const handleClick = () => {
              if (hasEv) {
                if (cell.events.length === 1) setSelected(cell.events[0].id);
                else setDayPicker(cell.events);
                return;
              }
              if (cellBirthdays.length > 0) { setBirthdayDay({ iso: cell.iso, members: cellBirthdays, past: isPast }); return; }
              if (!isPast && currentUser) { setPresetDate(cell.iso); setShowCreate(true); }
            };
            const clickable = hasEv || cellBirthdays.length > 0 || (!isPast && currentUser);
            return (
              <button key={i} onClick={handleClick} title={!hasEv && !isPast && currentUser ? "Proposer un moment jeux ce jour" : undefined} className="aladj-cal-cell" style={{
                aspectRatio: "1", minWidth: 0, border: isToday ? `2px solid ${C.navy}` : "1px solid #efe6d6", borderRadius: 12, background: hasEv ? "rgba(30,138,138,.08)" : "#fff",
                cursor: clickable ? "pointer" : "default", padding: 4, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-start", position: "relative", overflow: "hidden", opacity: isPast && !hasEv ? 0.5 : 1,
              }}>
                <span style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 600, fontSize: 13.5, color: C.navy }}>{cell.d}</span>
                {cellBirthdays.length > 0 && (
                  <span title={`Anniversaire de ${cellBirthdays.map((u) => u.name).join(", ")} 🎉`}
                    style={{ position: "absolute", top: 2, right: 4, fontSize: 11, lineHeight: 1 }}>🎂</span>
                )}
                {cell.events.slice(0, 2).map((e) => {
                  const reached = (e.players.length + (e.guests?.length || 0)) >= e.min;
                  const dimmed = isEventDimmed(e, currentUser);
                  const pillBg = dimmed ? "#9A8F7E" : (isEventExpired(e) ? "#2B2B2B" : (e.online ? (reached ? C.purple : C.amber) : (reached ? C.teal : C.red)));
                  return <span key={e.id} title={e.isPrivate ? (dimmed ? "Moment privé (vue administrateur)" : "Moment privé — sur invitation") : undefined}
                    style={{ maxWidth: "92%", marginTop: 3, fontSize: 9.5, fontFamily: "'Fredoka',sans-serif", fontWeight: 700, color: "#fff", background: pillBg, borderRadius: 5, padding: "1px 4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0 }}>{e.isPrivate ? "🔒" : ""}{e.time}</span>;
                })}
                {!hasEv && !isPast && currentUser && <Plus size={12} color="#cdb9a0" style={{ marginTop: 2 }} />}
              </button>
            );
          })}
        </div>
        <div style={{ display: "flex", gap: 18, marginTop: 14, justifyContent: "center", flexWrap: "wrap" }}>
          <Legend color={C.teal} label="Présentiel — confirmé" /><Legend color={C.red} label="Présentiel — en attente" /><Legend color={C.purple} label="En ligne — confirmé" /><Legend color={C.amber} label="En ligne — en attente" /><Legend color="#2B2B2B" label="Annulé — quorum non atteint" />{currentUser?.admin && <Legend color="#9A8F7E" label="Privé — vue administrateur" />}<Legend color={C.navy} label="Aujourd'hui" outline />
          <button onClick={() => setCalSub(true)} style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", color: C.teal, fontFamily: "'Fredoka',sans-serif", fontWeight: 600, fontSize: 13, padding: "2px 4px" }}>
            <CalendarPlus size={15} /> S'abonner au calendrier
          </button>
        </div>
      </div>

      {/* LISTE À VENIR */}
      <h3 style={{ fontFamily: "'Fredoka',sans-serif", color: C.navy, fontSize: 24, margin: "0 0 18px" }}>À venir</h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))", gap: 18 }}>
        {sorted.length === 0 && <EmptyHint icon={Calendar} text="Aucun moment jeux à venir. Proposez-en un !" />}
        {sorted.map((e) => <EventCardMini key={e.id} e={e} onOpen={() => setSelected(e.id)} />)}
      </div>

      {showCreate && <CreateEventModal presetDate={presetDate} onClose={() => { setShowCreate(false); setPresetDate(null); }} onCreate={async (d) => { const res = await addEvent(d); if (res?.error) return res; setShowCreate(false); setPresetDate(null); setToast("Moment jeux créé !"); if (!d.isPrivate) setJustCreated(d); return {}; }} />}
      {justCreated && <ShareEventModal event={justCreated} onClose={() => setJustCreated(null)} />}
      {dayPicker && (
        <Modal open onClose={() => setDayPicker(null)} title="Plusieurs moments jeux ce jour">
          <p style={{ margin: "0 0 16px", color: C.navy, opacity: .75, fontSize: 14.5 }}>Choisissez celui que vous voulez ouvrir :</p>
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr)", gap: 14 }}>
            {dayPicker.map((ev) => (
              <EventCardMini key={ev.id} e={ev} onOpen={() => { setSelected(ev.id); setDayPicker(null); }} />
            ))}
          </div>
        </Modal>
      )}
      {birthdayDay && (
        <Modal open onClose={() => setBirthdayDay(null)} title={`🎂 Anniversaire${birthdayDay.members.length > 1 ? "s" : ""} du ${formatDateFr(birthdayDay.iso)}`} width={480}>
          <p style={{ margin: "0 0 16px", fontSize: 14, color: "#6e6256", lineHeight: 1.55 }}>
            {birthdayDay.members.length > 1
              ? "Plusieurs membres fêtent leur anniversaire ce jour-là."
              : "Un membre fête son anniversaire ce jour-là."}
            {" "}Un petit mot fait toujours plaisir, même hors moment jeux.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr)", gap: 9 }}>
            {birthdayDay.members.map((u) => {
              const age = memberAge(u);
              return (
                <button key={u.id} type="button" onClick={() => { setBirthdayMember(u.id); setBirthdayDay(null); }}
                  title={`Voir la fiche de ${u.name}`}
                  style={{ display: "flex", alignItems: "center", gap: 12, background: "rgba(232,163,23,.09)", border: `1.5px solid ${C.amber}44`, borderRadius: 14, padding: "10px 13px", cursor: "pointer", textAlign: "left", minWidth: 0, font: "inherit" }}
                  onMouseEnter={(ev) => { ev.currentTarget.style.background = "rgba(232,163,23,.18)"; }}
                  onMouseLeave={(ev) => { ev.currentTarget.style.background = "rgba(232,163,23,.09)"; }}>
                  <span style={{ width: 46, height: 46, borderRadius: 13, flexShrink: 0, overflow: "hidden", background: u.role === "decideur" ? C.amber : C.teal, display: "grid", placeItems: "center" }}>
                    {u.avatar
                      ? <img src={u.avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : <span style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 700, color: "#fff", fontSize: 19 }}>{u.name[0].toUpperCase()}</span>}
                  </span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 5, fontFamily: "'Fredoka',sans-serif", fontWeight: 700, color: C.navy, fontSize: 16 }}>
                      {u.name}<DeciderCrownFor id={u.id} size={12} />
                    </span>
                    <span style={{ display: "block", fontSize: 12.5, color: "#8a7c6a", marginTop: 1 }}>
                      {age != null
                        ? (birthdayDay.past ? `a eu ${age} ans` : `fête ses ${age + (daysUntilBirthday(u) === 0 ? 0 : 1)} ans`)
                        : birthdayLabel(u, false)}
                    </span>
                  </span>
                  <ChevronRight size={17} color={C.amber} style={{ flexShrink: 0 }} />
                </button>
              );
            })}
          </div>
          {!birthdayDay.past && currentUser && (
            <Btn full variant="soft" style={{ marginTop: 16 }}
              onClick={() => { setPresetDate(birthdayDay.iso); setBirthdayDay(null); setShowCreate(true); }}>
              <Plus size={15} /> Proposer un moment jeux ce jour-là
            </Btn>
          )}
        </Modal>
      )}
      {birthdayMember && <MemberLibraryModal memberId={birthdayMember} onClose={() => setBirthdayMember(null)} setToast={setToast} onAuth={onAuth} />}
      {calSub && <CalendarSubscribeModal onClose={() => setCalSub(false)} setToast={setToast} />}
      {selectedEvent && <EventDetailModal e={selectedEvent} onClose={() => setSelected(null)} onJoin={toggleJoin} onRemove={async (id) => { await removeEvent(id); setSelected(null); setToast("Moment jeux supprimé."); }} onAuth={onAuth} />}
    </div>
  );
}
const navBtnStyle = { background: "rgba(26,58,92,.07)", border: "none", borderRadius: 10, width: 38, height: 38, cursor: "pointer", display: "grid", placeItems: "center", color: C.navy };
function Legend({ color, label, outline }) {
  return <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: "#6e6256" }}>
    <span style={{ width: 14, height: 14, borderRadius: 5, background: outline ? "transparent" : color, border: outline ? `2px solid ${color}` : "none" }} /> {label}
  </span>;
}

/* ---- Modale création moment jeux (fond rouge/vert dynamique) ---- */
/* ---- Sélecteur de lieu : choisir un lieu enregistré ou en créer un ---- */
function PlaceSelector({ value, placeId, onChange }) {
  // value = texte libre du lieu ; placeId = id du lieu enregistré (ou null)
  const { places, addPlace, currentUser } = useApp();
  const [mode, setMode] = useState(placeId ? "existing" : "free"); // "existing" | "free" | "new"
  const [newPlace, setNewPlace] = useState({ name: "", address: "", accessInfo: "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [editPlace, setEditPlace] = useState(null); // lieu en cours de modification

  const createNew = async () => {
    setErr("");
    if (!newPlace.name.trim()) { setErr("Donnez un nom au lieu."); return; }
    setBusy(true);
    const res = await addPlace(newPlace);
    setBusy(false);
    if (res?.error) { setErr(res.error); return; }
    onChange({ place: newPlace.name.trim(), placeId: res.id });
    setMode("existing");
    setNewPlace({ name: "", address: "", accessInfo: "" });
  };

  const selectedPlace = placeId ? places.find((p) => p.id === placeId) : null;

  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: "block", fontFamily: "'Fredoka',sans-serif", fontWeight: 600, color: C.navy, fontSize: 14, marginBottom: 6 }}>Lieu</label>
      <div style={{ display: "flex", gap: 6, marginBottom: 8, flexWrap: "wrap" }}>
        <button type="button" onClick={() => setMode("existing")} style={tabStyle(mode === "existing")}>Lieu enregistré</button>
        <button type="button" onClick={() => { setMode("free"); onChange({ place: value, placeId: null }); }} style={tabStyle(mode === "free")}>Saisie libre</button>
        <button type="button" onClick={() => setMode("new")} style={tabStyle(mode === "new")}>+ Nouveau lieu</button>
      </div>

      {mode === "existing" && (
        places.length === 0 ? (
          <p style={{ fontSize: 13, color: "#a89a86", margin: 0 }}>Aucun lieu enregistré pour l'instant. Créez-en un avec « + Nouveau lieu ».</p>
        ) : (
          <div>
            <select value={placeId || ""} onChange={(e) => { const p = places.find((x) => x.id === e.target.value); onChange({ place: p ? p.name : "", placeId: p ? p.id : null }); }} style={{ ...inputStyle, cursor: "pointer" }}>
              <option value="">— Choisir un lieu —</option>
              {places.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            {selectedPlace && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8, fontSize: 12.5, color: "#8a7c6a" }}>
                {selectedPlace.accessInfo ? <span>🅿️ Infos d'accès renseignées</span> : <span>Pas encore d'infos d'accès</span>}
                <button type="button" onClick={() => setEditPlace(selectedPlace)} style={{ background: "none", border: "none", color: C.teal, cursor: "pointer", fontSize: 12.5, fontFamily: "'Fredoka',sans-serif", fontWeight: 600, display: "flex", alignItems: "center", gap: 4, padding: 0 }}>
                  <Edit3 size={13} /> Modifier ce lieu
                </button>
              </div>
            )}
          </div>
        )
      )}

      {mode === "free" && (
        <TextInput value={value} onChange={(e) => onChange({ place: e.target.value, placeId: null })} placeholder="Ex. Local ALADJ — Gouville-sur-Mer" />
      )}

      {mode === "new" && (
        <div style={{ background: "rgba(30,138,138,.06)", borderRadius: 13, padding: 14 }}>
          <Field label="Nom du lieu"><TextInput value={newPlace.name} onChange={(e) => setNewPlace({ ...newPlace, name: e.target.value })} placeholder="Ex. Chez Justine - Régneville" /></Field>
          <Field label="Adresse exacte" hint="Facultatif"><TextInput value={newPlace.address} onChange={(e) => setNewPlace({ ...newPlace, address: e.target.value })} placeholder="12 rue des Jeux, 50590 Régneville" /></Field>
          <Field label="Accès & stationnement" hint="Comment se garer / accéder">
            <textarea value={newPlace.accessInfo} onChange={(e) => setNewPlace({ ...newPlace, accessInfo: e.target.value })} rows={2} style={{ ...inputStyle, resize: "vertical" }} placeholder="Parking devant la maison, sonner au portail bleu..." />
          </Field>
          {err && <div style={{ color: C.red, fontSize: 12.5, marginBottom: 8 }}>{err}</div>}
          <Btn size="sm" variant="teal" onClick={createNew} disabled={busy}>{busy ? <Loader2 size={14} className="aladj-spin" /> : <><Plus size={14} /> Créer ce lieu</>}</Btn>
        </div>
      )}

      {editPlace && <PlaceInfoModal place={editPlace} onClose={() => setEditPlace(null)} startEditing />}
    </div>
  );
}
function tabStyle(active) {
  return {
    padding: "6px 12px", borderRadius: 9, border: "1px solid " + (active ? C.teal : "#e6dcc9"),
    background: active ? C.teal : "#fff", color: active ? "#fff" : "#6e6256",
    fontSize: 12.5, fontFamily: "'Fredoka',sans-serif", fontWeight: 600, cursor: "pointer",
  };
}

function CreateEventModal({ onClose, onCreate, presetDate }) {
  const { currentUser, users } = useApp();
  const today = new Date().toISOString().slice(0, 10);
  const startDate = presetDate || today;
  const [f, setF] = useState({ date: startDate, time: "20:00", place: "Local ALADJ — Gouville-sur-Mer", placeId: null, online: false, min: 2, max: "", notes: "", joinSelf: true, isPrivate: false, useDeadline: false, deadlineDate: startDate, deadlineTime: "18:00", useSignupLimit: false, signupDate: startDate, signupTime: "18:00" });
  const [invites, setInvites] = useState([]); // {name, memberId|null}
  const [showInvite, setShowInvite] = useState(false);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  // le "fond" reflète : moi (si joinSelf) + invités ajoutés
  const startCount = (f.joinSelf ? 1 : 0) + invites.length;
  const reached = startCount >= Number(f.min);

  const addInvite = (name, memberId) => { setInvites((arr) => [...arr, { name, memberId }]); setShowInvite(false); };
  const removeInvite = (idx) => setInvites((arr) => arr.filter((_, i) => i !== idx));

  const submit = async () => {
    setErr("");
    if (!f.date || !f.time || (!f.online && !f.place.trim())) { setErr("Renseignez la date, l'heure et le lieu."); return; }
    const minN = Number(f.min) || 1;
    const maxN = f.max === "" || f.max == null ? null : Number(f.max); // null = pas de limite
    if (maxN != null && minN > maxN) { setErr("Le minimum ne peut pas dépasser le maximum."); return; }
    let deadline = null;
    if (f.useDeadline && f.deadlineDate && f.deadlineTime) {
      deadline = new Date(`${f.deadlineDate}T${f.deadlineTime}:00`).toISOString();
    }
    let signupDeadline = null;
    if (f.useSignupLimit && f.signupDate && f.signupTime) {
      const sd = new Date(`${f.signupDate}T${f.signupTime}:00`);
      if (isNaN(sd.getTime())) { setErr("Date limite d'inscription invalide."); return; }
      signupDeadline = sd.toISOString();
    }
    setBusy(true);
    const res = await onCreate({
      date: f.date, time: f.time, place: f.online ? "Board Game Arena" : f.place.trim(), placeId: f.online ? null : f.placeId, online: f.online,
      min: minN, max: maxN, notes: f.notes.trim(),
      joinSelf: f.joinSelf, isPrivate: f.isPrivate, deadline, signupDeadline, invites,
    });
    setBusy(false);
    if (res?.error) setErr(res.error);
  };

  return (
    <Modal open onClose={onClose} title="Proposer un moment jeux" width={580}>
      {/* bandeau d'état dynamique */}
      <div style={{
        borderRadius: 16, padding: "18px 20px", marginBottom: 22, color: "#fff", transition: "background .4s",
        background: reached ? (f.online ? `linear-gradient(135deg,${C.purple},#4a2856)` : `linear-gradient(135deg,${C.teal},#13615f)`) : (f.online ? `linear-gradient(135deg,${C.amber},#b07d10)` : `linear-gradient(135deg,${C.red},#8a1f2d)`),
        display: "flex", alignItems: "center", gap: 14,
      }}>
        <div style={{ width: 46, height: 46, borderRadius: 13, background: "rgba(255,255,255,.2)", display: "grid", placeItems: "center" }}>
          {reached ? <Check size={26} /> : <Users size={26} />}
        </div>
        <div>
          <div style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 700, fontSize: 17 }}>
            {reached ? "Quorum atteint — c'est lancé !" : "En attente de joueurs"}
          </div>
          <div style={{ fontSize: 13.5, opacity: .9 }}>
            {reached ? `Avec ${startCount} inscrit(s), le minimum de ${f.min} est couvert.` : `Il manque ${Math.max(0, f.min - startCount)} joueur(s) pour atteindre le minimum.`}
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <Field label="Jour"><TextInput type="date" min={today} value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></Field>
        <Field label="Heure"><TextInput type="time" value={f.time} onChange={(e) => setF({ ...f, time: e.target.value })} /></Field>
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        <button type="button" onClick={() => setF({ ...f, online: false, place: f.place === "Board Game Arena" ? "Local ALADJ — Gouville-sur-Mer" : f.place })}
          style={{ flex: 1, padding: "11px", borderRadius: 12, border: `2px solid ${!f.online ? C.teal : "#e6dcc9"}`, background: !f.online ? "rgba(30,138,138,.08)" : "#fff", color: C.navy, fontFamily: "'Fredoka',sans-serif", fontWeight: 700, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
          <MapPin size={16} /> En présentiel
        </button>
        <button type="button" onClick={() => setF({ ...f, online: true, place: "Board Game Arena", placeId: null })}
          style={{ flex: 1, padding: "11px", borderRadius: 12, border: `2px solid ${f.online ? C.purple : "#e6dcc9"}`, background: f.online ? "rgba(107,58,122,.08)" : "#fff", color: C.navy, fontFamily: "'Fredoka',sans-serif", fontWeight: 700, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
          <Globe size={16} /> En ligne (BGA)
        </button>
      </div>
      {f.online ? (
        <a href={SIGNAL_GROUPS.find((g) => g.name === "Jeux en ligne")?.url} target="_blank" rel="noopener noreferrer"
          style={{ display: "flex", alignItems: "center", gap: 9, padding: "12px 14px", borderRadius: 12, background: "rgba(107,58,122,.08)", color: C.navy, fontSize: 13.5, lineHeight: 1.45, marginBottom: 14, textDecoration: "none", border: `1.5px solid ${C.purple}33`, cursor: "pointer" }}>
          <Globe size={18} color={C.purple} style={{ flexShrink: 0 }} /> <span>Sur <b>&nbsp;Board Game Arena&nbsp;</b> — rendez-vous sur la conversation Signal «&nbsp;Jeux en ligne&nbsp;» à l'heure indiquée <b style={{ color: C.purple }}>(cliquez sur ce bandeau pour la rejoindre)</b>. <b>Jeux gratuits pour tous les participants</b> (compte premium de l'association).</span>
        </a>
      ) : (
        <PlaceSelector value={f.place} placeId={f.placeId} onChange={({ place, placeId }) => setF({ ...f, place, placeId })} />
      )}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <Field label="Joueurs min."><TextInput type="number" min={1} max={30} value={f.min} onChange={(e) => setF({ ...f, min: e.target.value })} /></Field>
        <Field label="Joueurs max." hint="Laisser vide = illimité"><TextInput type="number" min={1} max={40} value={f.max} onChange={(e) => setF({ ...f, max: e.target.value })} placeholder="illimité" /></Field>
      </div>

      {/* m'inscrire moi-même */}
      <label style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 12, background: "rgba(30,138,138,.07)", marginBottom: 14, cursor: "pointer" }}>
        <input type="checkbox" checked={f.joinSelf} onChange={(e) => setF({ ...f, joinSelf: e.target.checked })} style={{ width: 18, height: 18, accentColor: C.teal }} />
        <span style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 600, color: C.navy, fontSize: 14 }}>Je m'inscris à ce moment jeux</span>
      </label>

      {/* moment jeux privé */}
      <label style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "11px 14px", borderRadius: 12, background: f.isPrivate ? "rgba(107,58,122,.1)" : "rgba(26,58,92,.05)", border: `1.5px solid ${f.isPrivate ? C.purple : "transparent"}`, marginBottom: 14, cursor: "pointer" }}>
        <input type="checkbox" checked={f.isPrivate} onChange={(e) => setF({ ...f, isPrivate: e.target.checked })} style={{ width: 18, height: 18, accentColor: C.purple, marginTop: 2, flexShrink: 0 }} />
        <span style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 600, color: C.navy, fontSize: 14 }}>
          <Lock size={14} style={{ verticalAlign: "-2px", marginRight: 5, color: f.isPrivate ? C.purple : "#9c8d79" }} />
          Moment jeux privé
          <span style={{ display: "block", fontSize: 12.5, color: "#8a7c6a", fontWeight: 400, lineHeight: 1.5, marginTop: 3 }}>
            Seuls les membres que vous invitez le verront dans le calendrier. Il n'apparaîtra pas dans le calendrier public ni dans le flux d'abonnement iCal. Les administrateurs du site le voient en grisé. Valable aussi bien en présentiel qu'en ligne (BGA).
          </span>
        </span>
      </label>
      {f.isPrivate && invites.length === 0 && (
        <div style={{ background: "rgba(232,163,23,.12)", borderRadius: 11, padding: "9px 13px", marginBottom: 14, fontSize: 12.5, color: "#9a7b2a", lineHeight: 1.5 }}>
          <AlertTriangle size={14} style={{ verticalAlign: "-2px", marginRight: 5 }} />
          Pensez à ajouter vos invités ci-dessous : sans invité, vous serez seul à voir ce moment.
        </div>
      )}

      {/* invités dès la création */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: invites.length ? 10 : 0 }}>
          {invites.map((inv, idx) => (
            <span key={idx} style={{ display: "flex", alignItems: "center", gap: 7, background: "rgba(107,58,122,.1)", padding: "6px 12px", borderRadius: 999 }}>
              <span style={{ width: 22, height: 22, borderRadius: 6, background: C.purple, color: "#fff", display: "grid", placeItems: "center", fontFamily: "'Fredoka',sans-serif", fontWeight: 700, fontSize: 11 }}>{inv.name[0].toUpperCase()}</span>
              <span style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 600, color: C.navy, fontSize: 13 }}>{inv.name}</span>
              {inv.memberId && <span style={{ fontSize: 10, color: C.purple }}>(membre)</span>}
              <button onClick={() => removeInvite(idx)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: "#a07ab0", display: "grid", placeItems: "center" }}><X size={13} /></button>
            </span>
          ))}
        </div>
        {!showInvite ? (
          <Btn size="sm" variant="soft" onClick={() => setShowInvite(true)}><UserPlus size={15} /> Ajouter un invité</Btn>
        ) : (
          <GuestAdderInline users={users} excludeIds={invites.map((i) => i.memberId).filter(Boolean)} onAdd={addInvite} onCancel={() => setShowInvite(false)} />
        )}
      </div>

      {/* date limite de validation */}
      <label style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 12, background: "rgba(232,163,23,.1)", marginBottom: f.useDeadline ? 12 : 14, cursor: "pointer" }}>
        <input type="checkbox" checked={f.useDeadline} onChange={(e) => setF({ ...f, useDeadline: e.target.checked })} style={{ width: 18, height: 18, accentColor: C.amber }} />
        <span style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 600, color: C.navy, fontSize: 14 }}>Fixer une date limite (le moment jeux disparaît si le minimum n'est pas atteint à temps)</span>
      </label>
      {f.useDeadline && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <Field label="Valable jusqu'au"><TextInput type="date" min={today} max={f.date} value={f.deadlineDate} onChange={(e) => setF({ ...f, deadlineDate: e.target.value })} /></Field>
          <Field label="à"><TextInput type="time" value={f.deadlineTime} onChange={(e) => setF({ ...f, deadlineTime: e.target.value })} /></Field>
        </div>
      )}

      {/* limite d'inscription */}
      <label style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "11px 14px", borderRadius: 12, background: f.useSignupLimit ? "rgba(30,138,138,.1)" : "rgba(26,58,92,.05)", border: `1.5px solid ${f.useSignupLimit ? C.teal : "transparent"}`, marginBottom: f.useSignupLimit ? 12 : 14, cursor: "pointer" }}>
        <input type="checkbox" checked={f.useSignupLimit} onChange={(e) => setF({ ...f, useSignupLimit: e.target.checked })} style={{ width: 18, height: 18, accentColor: C.teal, marginTop: 2, flexShrink: 0 }} />
        <span style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 600, color: C.navy, fontSize: 14 }}>
          <Clock size={14} style={{ verticalAlign: "-2px", marginRight: 5, color: f.useSignupLimit ? C.teal : "#9c8d79" }} />
          Fixer une limite d'inscription
          <span style={{ display: "block", fontSize: 12.5, color: "#8a7c6a", fontWeight: 400, lineHeight: 1.5, marginTop: 3 }}>
            Passé cette date/heure, plus personne ne peut s'inscrire ni être invité — de quoi éviter les inscriptions de dernière minute. Vous pourrez toujours reculer la limite en modifiant le moment.
          </span>
        </span>
      </label>
      {f.useSignupLimit && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <Field label="Inscriptions jusqu'au"><TextInput type="date" min={today} max={f.date} value={f.signupDate} onChange={(e) => setF({ ...f, signupDate: e.target.value })} /></Field>
          <Field label="à"><TextInput type="time" value={f.signupTime} onChange={(e) => setF({ ...f, signupTime: e.target.value })} /></Field>
        </div>
      )}

      <Field label="Note (jeux prévus, ambiance...)" hint="Facultatif">
        <textarea value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} rows={2} placeholder="On sort les gros jeux de gestion ? Apéro partagé..."
          style={{ ...inputStyle, resize: "vertical", fontFamily: "'Nunito',sans-serif" }} />
      </Field>
      {err && <div style={{ background: "rgba(181,40,58,.1)", color: C.red, padding: "10px 14px", borderRadius: 11, fontSize: 13.5, fontWeight: 600, marginBottom: 14 }}>{err}</div>}
      <Btn full size="lg" variant={reached ? "teal" : "amber"} onClick={submit} disabled={busy}>{busy ? <Loader2 size={18} className="aladj-spin" /> : <><Plus size={18} /> Créer le moment jeux</>}</Btn>
    </Modal>
  );
}

/* ---- Modale détail soirée (fond plein rouge/vert) ---- */
function EventDetailModal({ e, onClose, onJoin, onRemove, onAuth }) {
  const { currentUser, users, places, addGuest, removeGuest, addComment, updateComment, removeComment, updateEvent, removePlayer, openChrono, askConfirm } = useApp();
  const [actionErr, setActionErr] = useState("");
  const linkedPlace = e.placeId ? places.find((p) => p.id === e.placeId) : null;
  const [showPlace, setShowPlace] = useState(false);
  const totalCount = e.players.length + (e.guests?.length || 0);
  const reached = totalCount >= e.min;
  const expired = isEventExpired(e);
  const full = e.max ? totalCount >= e.max : false;
  const isIn = currentUser && e.players.some((p) => p.id === currentUser.id);
  // Avant 14 ans, un compte enfant ne peut pas s'inscrire aux moments jeux
  // de l'association ouverts à tous (présentiel comme BGA). Les moments privés,
  // eux, lui restent accessibles.
  const childBlocked = !!currentUser && isChildAccount(currentUser) && !e.isPrivate && !isIn;
  const isParticipant = currentUser && (isIn || e.hostId === currentUser.id);
  const canManage = currentUser && (currentUser.id === e.hostId || currentUser.admin);
  // Jeux joues : tous les participants du moment, et les administrateurs.
  const canEditPlayed = !!currentUser && (!!isParticipant || currentUser.admin === true);
  const eventReacts = useReactions("event", (e.comments || []).map((c) => c.id));
  // Inscriptions closes (limite fixee par l'organisateur, ou 48 h apres le debut).
  const signupClosed = isSignupClosed(e);
  const signupCloseDate = signupCloseAt(e);
  const closedForMe = signupClosed && !(currentUser && currentUser.admin);

  const [showGuest, setShowGuest] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const [busy, setBusy] = useState(false);

  const deadlineStr = e.deadline ? new Date(e.deadline) : null;
  const deadlinePassed = deadlineStr && Date.now() > deadlineStr.getTime();
  const overlayBg = expired ? "rgba(22,22,22,.94)" : e.online ? (reached ? "rgba(74,40,86,.92)" : "rgba(176,125,16,.92)") : (reached ? "rgba(19,97,95,.92)" : "rgba(138,31,45,.92)");
  const headerGrad = expired ? "linear-gradient(135deg,#3a3a3a,#141414)" : e.online ? (reached ? `linear-gradient(135deg,${C.purple},#4a2856)` : `linear-gradient(135deg,${C.amber},#b07d10)`) : (reached ? `linear-gradient(135deg,${C.teal},#13615f)` : `linear-gradient(135deg,${C.red},#8a1f2d)`);

  const submitComment = async () => {
    if (!commentText.trim()) return;
    setBusy(true); await addComment(e.id, commentText); setBusy(false); setCommentText("");
  };
  const saveEdit = async () => {
    if (!editText.trim()) return;
    await updateComment(editingId, editText); setEditingId(null); setEditText("");
  };

  useScrollLock(true);   // cette fenetre n'est montee que lorsqu'elle est visible

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "5vh 16px",
      overflowY: "auto", overscrollBehavior: "contain", WebkitOverflowScrolling: "touch",
      background: overlayBg, transition: "background .4s", backdropFilter: "blur(3px)" }}>
      <div onClick={(ev) => ev.stopPropagation()} style={{ background: C.paper, borderRadius: 24, width: "100%", maxWidth: 560, overflow: "hidden", boxShadow: "0 30px 80px rgba(0,0,0,.4)", animation: "popIn .25s ease" }}>
        <div style={{ padding: "22px 26px", color: "#fff", background: headerGrad, position: "relative" }}>
          <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, background: "rgba(255,255,255,.2)", border: "none", borderRadius: 10, width: 34, height: 34, cursor: "pointer", display: "grid", placeItems: "center", color: "#fff" }}><X size={18} /></button>
          <span style={{ display: "inline-flex", gap: 7, flexWrap: "wrap", alignItems: "center" }}>
            <Badge color="#fff" soft={false}>{expired ? "⛔ Annulé — quorum non atteint" : reached ? <><Check size={13} /> Moment jeux confirmé</> : "En attente de joueurs"}</Badge>
            {e.isPrivate && <Badge color="#fff" soft={false}><Lock size={12} /> Moment privé</Badge>}
          </span>
          <h2 style={{ fontFamily: "'Fredoka',sans-serif", fontSize: 26, margin: "12px 0 4px", textTransform: "capitalize" }}>{formatDateFr(e.date)}</h2>
          {(() => {
            const bd = birthdayMembersOn(e.date, users);
            if (!bd.length) return null;
            const names = bd.map((u) => u.name);
            const list = names.length > 1 ? names.slice(0, -1).join(", ") + " et " + names[names.length - 1] : names[0];
            return (
              <div style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "rgba(255,255,255,.2)", borderRadius: 999, padding: "4px 13px", fontSize: 13.5, fontWeight: 700, marginBottom: 6 }}>
                🎂 Ce jour-là, on fête l'anniversaire de {list} !
              </div>
            );
          })()}
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", opacity: .95, fontSize: 14.5 }}>
            <span style={{ display: "flex", gap: 6, alignItems: "center" }}><Clock size={16} /> {e.time}</span>
            {e.online ? (
              <span style={{ display: "flex", gap: 6, alignItems: "center" }}><Globe size={16} /> Board Game Arena · jeux gratuits (compte de l'asso)</span>
            ) : !currentUser ? (
              <span style={{ display: "flex", gap: 6, alignItems: "center", opacity: .8 }}><MapPin size={16} /> <i>Lieu réservé aux membres connectés</i></span>
            ) : linkedPlace ? (
              <button onClick={() => setShowPlace(true)} style={{ display: "flex", gap: 6, alignItems: "center", background: "rgba(255,255,255,.18)", border: "none", borderRadius: 8, padding: "3px 10px", cursor: "pointer", color: "#fff", fontSize: 14.5, fontFamily: "'Nunito',sans-serif", textDecoration: "underline", textUnderlineOffset: 3 }} title="Voir les infos d'accès">
                <MapPin size={16} /> {e.place} <Info size={13} />
              </button>
            ) : (
              <span style={{ display: "flex", gap: 6, alignItems: "center" }}><MapPin size={16} /> {e.place}</span>
            )}
          </div>
        </div>

        <div style={{ padding: 26 }}>
          {e.isPrivate && (
            <div style={{ display: "flex", alignItems: "flex-start", gap: 9, background: "rgba(107,58,122,.09)", border: `1.5px solid ${C.purple}33`, borderRadius: 13, padding: "11px 14px", marginBottom: 16, fontSize: 13.5, lineHeight: 1.5, color: C.navy }}>
              <Lock size={17} color={C.purple} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>
                <b>Moment jeux privé.</b> Il n'est visible que par les membres conviés et n'apparaît ni dans le calendrier public ni dans le flux d'abonnement iCal.
                {isEventDimmed(e, currentUser) && <> <b style={{ color: C.purple }}>Vous le voyez en tant qu'administrateur du site</b> — vous n'y êtes pas convié.</>}
              </span>
            </div>
          )}
          {e.online && (
            <a href="https://signal.group/#CjQKIDrh0Erb7vmLuqhbBcjelvyRNlakSz8S0DWuwYzbY9PMEhCa0Qkdic8YD72P2HPBjUVK" target="_blank" rel="noopener noreferrer"
              style={{ display: "flex", alignItems: "center", gap: 11, textDecoration: "none", background: "rgba(107,58,122,.09)", border: `1.5px solid ${C.purple}33`, borderRadius: 13, padding: "13px 15px", marginBottom: 16 }}>
              <Globe size={22} color={C.purple} style={{ flexShrink: 0 }} />
              <span style={{ fontSize: 13.5, lineHeight: 1.45, color: C.navy }}>
                Partie <b>en ligne sur Board Game Arena</b>. Rendez-vous sur la conversation Signal <b>«&nbsp;Jeux en ligne&nbsp;»</b> à {e.time} — <b style={{ color: "#e9d8f2" }}>cliquez ici pour la rejoindre</b>.
              </span>
            </a>
          )}
          {/* date limite */}
          {deadlineStr && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: reached ? "rgba(30,138,138,.1)" : "rgba(232,163,23,.12)", borderRadius: 11, padding: "9px 14px", marginBottom: 16, fontSize: 13, color: reached ? C.teal : "#9a7b2a", fontWeight: 600 }}>
              <Clock size={15} />
              {expired ? "Le quorum n'a pas été atteint avant la fin du délai de validation : ce moment est annulé. Son créateur ou un admin peut prolonger le délai pour le réactiver." : reached ? "Quorum atteint, le moment jeux est maintenu." : `À valider avant le ${formatDateFr(deadlineStr.toISOString().slice(0,10))} à ${deadlineStr.toTimeString().slice(0,5)}`}
            </div>
          )}

          {/* fenetre d'inscription */}
          {!expired && currentUser && signupCloseDate && (
            <div style={{ display: "flex", alignItems: "flex-start", gap: 8, background: signupClosed ? "rgba(181,40,58,.09)" : "rgba(30,138,138,.09)", border: `1.5px solid ${signupClosed ? C.red : C.teal}33`, borderRadius: 11, padding: "9px 14px", marginBottom: 16, fontSize: 13, color: signupClosed ? C.red : C.teal, fontWeight: 600, lineHeight: 1.5 }}>
              <Lock size={15} style={{ flexShrink: 0, marginTop: 2 }} />
              <span>
                {signupClosed
                  ? <>Inscriptions closes depuis le <b>{formatDateTimeFr(signupCloseDate)}</b>{signupClosedReason(e) === "lock48" ? <> — plus aucun ajout {SIGNUP_LOCK_HOURS} h après le début du moment.</> : " (limite fixée par l'organisateur)."}
                      {currentUser.admin && <span style={{ display: "block", color: C.purple, fontWeight: 700, marginTop: 3 }}>Vous pouvez tout de même agir en tant qu'administrateur.</span>}</>
                  : <>Inscriptions ouvertes jusqu'au <b>{formatDateTimeFr(signupCloseDate)}</b>{signupClosedReason(e) === "lock48" ? "" : " (limite fixée par l'organisateur)"}.</>}
              </span>
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 700, color: C.navy, fontSize: 17 }}>
              {totalCount}{e.max ? ` / ${e.max}` : ""} participant{totalCount > 1 ? "s" : ""}{!e.max ? " · sans limite" : ""}
            </span>
            <span style={{ fontSize: 13.5, color: reached ? C.teal : C.red, fontWeight: 700 }}>
              {reached ? "Minimum atteint ✓" : `Encore ${e.min - totalCount} pour valider`}
            </span>
          </div>
          <div style={{ height: 12, borderRadius: 99, background: "#eee4d2", overflow: "hidden", marginBottom: 6, position: "relative" }}>
            <div style={{ height: "100%", width: `${e.max ? Math.min(100, (totalCount / e.max) * 100) : (reached ? 100 : (totalCount / Math.max(e.min, 1)) * 100)}%`, background: reached ? C.teal : C.red, transition: "width .4s" }} />
            {e.max ? <div style={{ position: "absolute", top: 0, bottom: 0, left: `${(e.min / e.max) * 100}%`, width: 2, background: C.navy, opacity: .4 }} /> : null}
          </div>
          <div style={{ fontSize: 11.5, color: "#9c8d79", marginBottom: 18 }}>{e.max ? `↑ le repère indique le minimum requis (${e.min})` : `Minimum requis : ${e.min} joueur${e.min > 1 ? "s" : ""}`}</div>

          {/* participants inscrits + invités */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
            {totalCount === 0 && <span style={{ color: "#a89a86", fontSize: 14 }}>Personne inscrit pour l'instant.</span>}
            {e.players.map((p) => {
              // Peuvent retirer une inscription : le participant lui-même, le créateur du moment, un administrateur.
              const canRemovePlayer = !!currentUser && !expired && (p.id === currentUser.id || currentUser.id === e.hostId || currentUser.admin === true);
              const isSelf = !!currentUser && p.id === currentUser.id;
              return (
                <span key={p.id} style={{ display: "flex", alignItems: "center", gap: 7, background: "rgba(30,138,138,.1)", padding: "6px 12px", borderRadius: 999 }}>
                  <span style={{ width: 24, height: 24, borderRadius: 7, background: C.teal, color: "#fff", display: "grid", placeItems: "center", fontFamily: "'Fredoka',sans-serif", fontWeight: 700, fontSize: 12 }}>{p.name[0].toUpperCase()}</span>
                  <span style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 600, color: C.navy, fontSize: 13.5 }}>{p.name}</span><DeciderCrownFor id={p.id} size={12} /><ChildPacifierFor id={p.id} size={12} />
                  <ColorPrefs colors={(users.find((u) => u.id === p.id) || {}).favColors} />
                  {canRemovePlayer && (
                    <button onClick={async () => {
                      setActionErr("");
                      const ok = await askConfirm({
                        title: isSelf ? "Vous retirer de ce moment jeux ?" : `Retirer ${p.name} ?`,
                        message: isSelf
                          ? "Vous ne serez plus inscrit à ce moment jeux. Vous pourrez vous réinscrire à tout moment."
                          : `${p.name} ne sera plus inscrit à ce moment jeux et en sera informé par une notification. Il pourra se réinscrire lui-même.`,
                        confirmLabel: "Retirer",
                      });
                      if (!ok) return;
                      const res = await removePlayer(e.id, p.id);
                      if (res?.error) setActionErr(res.error);
                    }} title={isSelf ? "Me retirer de ce moment jeux" : `Retirer ${p.name} de ce moment jeux`}
                      style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: "#2a8f8f", display: "grid", placeItems: "center" }}><X size={14} /></button>
                  )}
                </span>
              );
            })}
            {(e.guests || []).map((g) => {
              const canRemoveGuest = currentUser && (g.addedBy === currentUser.id || canManage);
              const memberPending = !!g.memberId; // membre invité, en attente de sa confirmation
              const chipBg = memberPending ? "rgba(232,163,23,.13)" : "rgba(107,58,122,.1)";
              const sqBg = memberPending ? C.amber : C.purple;
              const xColor = memberPending ? "#b88a2e" : "#a07ab0";
              return (
                <span key={g.id} style={{ display: "flex", alignItems: "center", gap: 7, background: chipBg, padding: "6px 12px", borderRadius: 999 }}>
                  <span style={{ width: 24, height: 24, borderRadius: 7, background: sqBg, color: "#fff", display: "grid", placeItems: "center", fontFamily: "'Fredoka',sans-serif", fontWeight: 700, fontSize: 12 }}>{g.name[0].toUpperCase()}</span>
                  <span style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 600, color: C.navy, fontSize: 13.5 }}>{g.name}</span>
                  {memberPending && <span style={{ fontSize: 10.5, color: "#b88a2e", fontWeight: 700 }}>en attente</span>}
                  {canRemoveGuest && <button onClick={() => removeGuest(g.id)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: xColor, display: "grid", placeItems: "center" }}><X size={14} /></button>}
                </span>
              );
            })}
          </div>

          {actionErr && <div style={{ background: "rgba(181,40,58,.1)", color: C.red, padding: "9px 13px", borderRadius: 11, fontSize: 13, fontWeight: 600, marginBottom: 12 }}>{actionErr}</div>}

          {/* ajouter un invité (participants + créateur) */}
          {isParticipant && (
            <div style={{ marginBottom: 18, display: expired ? "none" : "block" }}>
              {closedForMe ? (
                <span style={{ fontSize: 12.5, color: "#a89a86" }}>Les inscriptions sont closes : plus aucun invité ne peut être ajouté.</span>
              ) : !showGuest ? (
                <Btn size="sm" variant="soft" onClick={() => setShowGuest(true)}><UserPlus size={15} /> Ajouter un invité</Btn>
              ) : (
                <GuestAdder users={users} currentEvent={e} onAdd={addGuest} onDone={() => setShowGuest(false)} />
              )}
            </div>
          )}

          {e.notes && <div style={{ background: "rgba(232,163,23,.1)", borderRadius: 13, padding: "12px 16px", marginBottom: 18, fontSize: 14, color: "#6e5e42", lineHeight: 1.5 }}><b style={{ fontFamily: "'Fredoka',sans-serif", color: C.amber }}>Note :</b> {e.notes}</div>}

          <div style={{ fontSize: 13, color: "#9c8d79", marginBottom: 16 }}>Proposée par <b style={{ color: C.navy }}>{e.hostName}</b></div>

          {currentUser && expired && (
            <div style={{ display: "flex", gap: 10, marginBottom: 22 }}>
              {canManage && <Btn full size="lg" variant="soft" onClick={() => setShowEdit(true)}><Edit3 size={17} /> Modifier le moment (prolonger le délai)</Btn>}
            </div>
          )}
          {childBlocked && (
            <div style={{ display: "flex", alignItems: "flex-start", gap: 9, background: "rgba(107,58,122,.09)", border: `1.5px solid ${C.purple}33`, borderRadius: 13, padding: "11px 14px", marginBottom: 14, fontSize: 13.5, lineHeight: 1.5, color: C.navy }}>
              <span style={{ flexShrink: 0, marginTop: 1 }}><PacifierIcon size={17} /></span>
              <span>
                Ce moment jeux est <b>ouvert à tous</b> : les comptes enfants ne peuvent pas s'y inscrire avant {CHILD_AGE_LIMIT} ans. Les <b>moments jeux privés</b>, eux, restent accessibles — demandez à un membre de vous y inviter.
              </span>
            </div>
          )}
          {currentUser && !expired ? (
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 22 }}>
              <Btn full={!canManage} size="lg" variant={isIn ? "ghost" : (reached ? "teal" : "red")}
                disabled={childBlocked || (!isIn && (full || closedForMe))}
                onClick={async () => { setActionErr(""); const r = await onJoin(e.id); if (r?.error) setActionErr(r.error); }}
                style={canManage ? { flex: 1 } : {}}>
                {isIn ? <><X size={17} /> Me retirer</> : childBlocked ? "Réservé aux 14 ans et plus" : closedForMe ? <><Lock size={16} /> Inscriptions closes</> : full ? "Complet" : <><Check size={17} /> Je participe</>}
              </Btn>
              {canManage && <Btn variant="soft" size="lg" onClick={() => setShowEdit(true)}><Edit3 size={17} /></Btn>}
              {canManage && <Btn variant="danger" size="lg" onClick={async () => { if (await askConfirm({ title: "Supprimer ce moment jeux ?", message: "Le moment, ses inscriptions et ses commentaires seront supprimés pour tous les membres. Action définitive.", confirmLabel: "Supprimer" })) onRemove(e.id); }}><Trash2 size={17} /></Btn>}
            </div>
          ) : (
            <Btn full size="lg" variant="primary" onClick={() => { onClose(); onAuth("login"); }} style={{ marginBottom: 22 }}><LogIn size={18} /> Se connecter pour participer</Btn>
          )}

          {currentUser && !expired && (
            <>
              <EventLiveChronos eventId={e.id} />
              <Btn full variant="teal" style={{ marginBottom: 18 }} onClick={() => { onClose(); openChrono({ eventId: e.id }); }}>
                <Clock size={17} /> Lancer le chrono de la partie
              </Btn>
            </>
          )}

          {/* JEUX JOUÉS */}
          <EventPlayedGames e={e} isParticipant={!expired && canEditPlayed} canManage={!expired && !!canManage} />

          {/* COMMENTAIRES */}
          <div style={{ borderTop: "1px solid #f0e8d8", paddingTop: 18 }}>
            <h4 style={{ fontFamily: "'Fredoka',sans-serif", color: C.navy, fontSize: 16, margin: "0 0 12px" }}>💬 Discussion ({(e.comments || []).length})</h4>
            <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr)", gap: 10, marginBottom: 14 }}>
              {(e.comments || []).length === 0 && <span style={{ color: "#a89a86", fontSize: 13.5 }}>Aucun commentaire. Lancez la discussion !</span>}
              {(e.comments || []).map((c) => {
                const mine = currentUser && c.authorId === currentUser.id;
                const edited = c.updatedAt && c.createdAt && new Date(c.updatedAt).getTime() - new Date(c.createdAt).getTime() > 2000;
                return (
                  <div key={c.id} style={{ background: "rgba(26,58,92,.04)", borderRadius: 13, padding: "10px 14px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><span style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 700, color: mine ? C.teal : C.navy, fontSize: 13.5 }}>{c.authorName}{mine ? " (vous)" : ""}</span><DeciderCrownFor id={c.authorId} size={13} /><ChildPacifierFor id={c.authorId} size={13} /></span>
                      {mine && editingId !== c.id && (
                        <span style={{ display: "flex", gap: 8 }}>
                          <button onClick={() => { setEditingId(c.id); setEditText(c.content); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#9c8d79", padding: 0 }}><Edit3 size={14} /></button>
                          <button onClick={async () => { if (await askConfirm({ title: "Supprimer ce commentaire ?", message: "Votre commentaire sera supprimé définitivement.", confirmLabel: "Supprimer" })) removeComment(c.id); }} style={{ background: "none", border: "none", cursor: "pointer", color: C.red, padding: 0 }}><Trash2 size={14} /></button>
                        </span>
                      )}
                    </div>
                    {editingId === c.id ? (
                      <div>
                        <textarea value={editText} onChange={(ev) => setEditText(ev.target.value)} rows={2} style={{ ...inputStyle, resize: "vertical", marginBottom: 8 }} />
                        <div style={{ display: "flex", gap: 8 }}>
                          <Btn size="sm" variant="teal" onClick={saveEdit}><Check size={14} /> Enregistrer</Btn>
                          <Btn size="sm" variant="soft" onClick={() => setEditingId(null)}>Annuler</Btn>
                        </div>
                      </div>
                    ) : (
                      <>                      <div style={{ fontSize: 14, color: "#5e5346", lineHeight: 1.5, whiteSpace: "pre-line" }}>{c.content}{edited && <span style={{ fontSize: 11, color: "#b6a78f", fontStyle: "italic" }}> (modifié)</span>}</div>
                      <CommentReactions commentId={c.id} rows={eventReacts.rows} onReact={eventReacts.react} />
                      </>
                    )}
                  </div>
                );
              })}
            </div>
            {currentUser && !expired ? (
              <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
                <textarea value={commentText} onChange={(ev) => setCommentText(ev.target.value)} rows={1} placeholder="Écrire un commentaire..." style={{ ...inputStyle, resize: "vertical", flex: 1 }} />
                <Btn variant="teal" onClick={submitComment} disabled={busy || !commentText.trim()}>{busy ? <Loader2 size={16} className="aladj-spin" /> : "Envoyer"}</Btn>
              </div>
            ) : (
              <span style={{ fontSize: 13, color: "#a89a86" }}>Connectez-vous pour commenter.</span>
            )}
          </div>
        </div>
      </div>
      {showEdit && <EditEventModal e={e} onClose={() => setShowEdit(false)} onSave={async (patch) => { await updateEvent(e.id, patch); setShowEdit(false); }} />}
      {showPlace && linkedPlace && <PlaceInfoModal place={linkedPlace} onClose={() => setShowPlace(false)} />}
    </div>
  );
}

/* ---- Section : jeux joués lors d'un moment ---- */
/* Chronos deja lances sur un moment jeux.
   Sans cet encart, deux personnes autour de la meme table lancaient chacune
   leur chrono sans le savoir : on propose desormais de rejoindre l'existant. */
function EventLiveChronos({ eventId }) {
  const { openChrono, users, games } = useApp();
  const [rows, setRows] = useState([]);

  const load = useCallback(async () => {
    const { data } = await supabase.from("play_sessions")
      .select("id,join_code,status,game_id,host_profile_id,created_at")
      .eq("event_id", eventId).in("status", ["lobby", "running"])
      .order("created_at", { ascending: false });
    if (!data || !data.length) { setRows([]); return; }
    const { data: pl } = await supabase.from("play_session_players")
      .select("session_id").in("session_id", data.map((x) => x.id));
    const n = {};
    (pl || []).forEach((r) => { n[r.session_id] = (n[r.session_id] || 0) + 1; });
    setRows(data.map((x) => ({ ...x, nPlayers: n[x.id] || 0 })));
  }, [eventId]);

  useEffect(() => {
    load();
    // Une partie peut demarrer pendant qu'on regarde la fiche : on rafraichit.
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, [load]);

  if (!rows.length) return null;

  return (
    <div style={{ marginBottom: 20 }}>
      <h4 style={{ fontFamily: "'Fredoka',sans-serif", color: C.navy, fontSize: 15.5, margin: "0 0 9px", display: "flex", alignItems: "center", gap: 7 }}>
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: C.red, boxShadow: `0 0 0 3px ${C.red}33` }} />
        {rows.length > 1 ? "Chronos en cours" : "Chrono en cours"}
      </h4>
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr)", gap: 8 }}>
        {rows.map((r) => {
          const g = (games || []).find((x) => x.id === r.game_id);
          const host = (users || []).find((u) => u.id === r.host_profile_id);
          return (
            <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 11, background: "#fff", border: `1.5px solid ${C.teal}44`, borderRadius: 13, padding: "9px 12px", minWidth: 0 }}>
              <span style={{ width: 40, height: 40, borderRadius: 9, flexShrink: 0, background: g && g.img ? `center/cover url("${g.img}")` : `linear-gradient(135deg,${C.teal},${C.navy})` }} />
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: "block", fontFamily: "'Fredoka',sans-serif", fontWeight: 600, color: C.navy, fontSize: 14.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {g ? g.name : "Partie en cours"}
                </span>
                <span style={{ display: "block", fontSize: 12, color: "#9c8d79" }}>
                  lancé par {host ? host.name : "un membre"} · {r.nPlayers} joueur{r.nPlayers > 1 ? "s" : ""} · {r.status === "running" ? "en cours" : "en attente"}
                </span>
              </span>
              <Btn size="sm" variant="teal" onClick={() => openChrono({ joinCode: r.join_code })}>Rejoindre</Btn>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function EventPlayedGames({ e, isParticipant, canManage }) {
  const { games, currentUser, addPlayedGame, removePlayedGame, setEventPlayCount, askConfirm } = useApp();
  const counterBtn = { width: 24, height: 24, borderRadius: 7, border: "1.5px solid #d9cdb6", background: "#fff", color: C.navy, fontSize: 15, lineHeight: 1, cursor: "pointer", display: "grid", placeItems: "center", padding: 0, flexShrink: 0 };
  const [adding, setAdding] = useState(false);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [openedGameId, setOpenedGameId] = useState(null); // jeu joué cliqué pour ouvrir sa fiche
  const played = e.playedGames || [];

  // ids déjà notés pour ce moment (pour les masquer de la recherche)
  const alreadyIds = new Set(played.map((p) => p.gameId));

  // suggestions : jeux de l'asso filtrés par la saisie, excluant ceux déjà notés ce moment
  const suggestions = useMemo(() => {
    if (!q.trim()) return [];
    const n = q.toLowerCase();
    return games
      .filter((g) => !alreadyIds.has(g.id) && g.name.toLowerCase().includes(n))
      .slice(0, 8);
  }, [games, q, played]);

  const submit = async (gameId) => {
    setBusy(true); setErr("");
    const res = await addPlayedGame(e.id, gameId);
    setBusy(false);
    if (res?.error) { setErr(res.error); return; }
    setQ("");
  };

  return (
    <div style={{ borderTop: "1px solid #f0e8d8", paddingTop: 18, marginBottom: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <h4 style={{ fontFamily: "'Fredoka',sans-serif", color: C.navy, fontSize: 16, margin: 0 }}>🎲 Jeux joués ({played.length})</h4>
        {isParticipant && !adding && <Btn size="sm" variant="soft" onClick={() => setAdding(true)}><Plus size={14} /> Ajouter</Btn>}
      </div>

      {played.length === 0 && !adding && <span style={{ color: "#a89a86", fontSize: 13.5 }}>Aucun jeu noté pour ce moment.</span>}

      {/* liste des jeux joués */}
      {played.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr)", gap: 8, marginBottom: adding ? 14 : 0 }}>
          {played.map((p) => {
            // Regle : tous les membres presents au moment (et les administrateurs)
            // peuvent ajouter ou retirer un jeu joue, pas seulement celui qui l'a ajoute.
            const mineToRemove = !!currentUser && (isParticipant || canManage);
            const gameStillExists = !!games.find((g) => g.id === p.gameId);
            return (
              <div key={p.id} role={gameStillExists ? "button" : undefined} tabIndex={gameStillExists ? 0 : undefined}
                onClick={() => { if (gameStillExists) setOpenedGameId(p.gameId); }}
                title={gameStillExists ? "Voir la fiche du jeu (pour le noter par exemple)" : undefined}
                style={{ display: "flex", alignItems: "center", gap: 12, background: "rgba(26,58,92,.04)", borderRadius: 11, padding: "8px 12px", cursor: gameStillExists ? "pointer" : "default", transition: "background .15s" }}
                onMouseEnter={(ev) => { if (gameStillExists) ev.currentTarget.style.background = "rgba(30,138,138,.08)"; }}
                onMouseLeave={(ev) => { ev.currentTarget.style.background = "rgba(26,58,92,.04)"; }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, flexShrink: 0, background: p.gameImg ? `center/cover url("${p.gameImg}")` : `linear-gradient(135deg,${C.teal},${C.purple})`, display: "grid", placeItems: "center" }}>
                  {!p.gameImg && <span style={{ color: "#fff", fontFamily: "'Fredoka',sans-serif", fontWeight: 700, fontSize: 11 }}>{p.gameName.slice(0, 2).toUpperCase()}</span>}
                </div>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "block", fontFamily: "'Fredoka',sans-serif", fontWeight: 600, color: C.navy, fontSize: 14 }}>{p.gameName}</span>
                  <span style={{ display: "block", fontSize: 11.5, color: "#9c8d79" }}>ajouté par {p.addedByName}{(p.playCount || 1) > 1 ? ` · ${p.playCount} parties` : ""}{gameStillExists ? " · cliquez pour noter" : ""}</span>
                </span>
                {(isParticipant || canManage) && (
                  <div onClick={(ev) => ev.stopPropagation()} title="Nombre de parties jouées" style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                    <button onClick={() => setEventPlayCount(p.id, Math.max(1, (p.playCount || 1) - 1))} disabled={(p.playCount || 1) <= 1} style={{ ...counterBtn, opacity: (p.playCount || 1) <= 1 ? 0.4 : 1, cursor: (p.playCount || 1) <= 1 ? "default" : "pointer" }} aria-label="Une partie de moins">−</button>
                    <span style={{ minWidth: 20, textAlign: "center", fontFamily: "'Fredoka',sans-serif", fontWeight: 700, fontSize: 14, color: C.navy }}>{p.playCount || 1}</span>
                    <button onClick={() => setEventPlayCount(p.id, Math.min(50, (p.playCount || 1) + 1))} style={counterBtn} aria-label="Une partie de plus">+</button>
                  </div>
                )}
                {mineToRemove && <button onClick={async (ev) => { ev.stopPropagation(); if (await askConfirm({ title: "Retirer ce jeu ?", message: "Ce jeu sera retiré de la liste des jeux joués de ce moment.", confirmLabel: "Retirer" })) removePlayedGame(p.id); }} title="Retirer ce jeu" style={{ background: "none", border: "none", cursor: "pointer", color: C.red, padding: 4, flexShrink: 0 }}><Trash2 size={14} /></button>}
              </div>
            );
          })}
        </div>
      )}

      {/* recherche / ajout */}
      {adding && (
        <div style={{ background: "rgba(30,138,138,.06)", borderRadius: 12, padding: 12 }}>
          <Field label="Rechercher un jeu de la ludothèque" hint={isParticipant ? "Tous les participants du moment peuvent ajouter ou retirer un jeu joué." : null}>
            <div style={{ position: "relative" }}>
              <Search size={16} color="#b6a78f" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
              <TextInput value={q} onChange={(ev) => setQ(ev.target.value)} placeholder="Nom du jeu..." autoFocus style={{ paddingLeft: 38 }} />
            </div>
          </Field>
          {err && <div style={{ background: "rgba(181,40,58,.08)", color: C.red, padding: "8px 11px", borderRadius: 8, fontSize: 12.5, marginBottom: 8 }}>{err}</div>}
          {q.trim() && (
            <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr)", gap: 5, maxHeight: 240, overflowY: "auto", marginBottom: 10 }}>
              {suggestions.length === 0 && <span style={{ fontSize: 13, color: "#a89a86", padding: "4px 6px" }}>Aucun jeu correspondant (ou déjà ajouté).</span>}
              {suggestions.map((g) => (
                <button key={g.id} type="button" onClick={() => submit(g.id)} disabled={busy}
                  style={{ display: "flex", alignItems: "center", gap: 10, background: "#fff", border: "1px solid #ece2d0", borderRadius: 9, padding: "7px 10px", cursor: busy ? "wait" : "pointer", textAlign: "left" }}>
                  <div style={{ width: 28, height: 28, borderRadius: 6, flexShrink: 0, background: g.img ? `center/cover url("${g.img}")` : `linear-gradient(135deg,${C.teal},${C.purple})` }} />
                  <span style={{ flex: 1, minWidth: 0, fontFamily: "'Fredoka',sans-serif", fontWeight: 600, color: C.navy, fontSize: 13 }}>{g.name}</span>
                  <Plus size={13} color={C.teal} />
                </button>
              ))}
            </div>
          )}
          <Btn size="sm" variant="soft" onClick={() => { setAdding(false); setQ(""); setErr(""); }}>Fermer</Btn>
        </div>
      )}

      {!isParticipant && !canManage && currentUser && (
        <span style={{ fontSize: 12.5, color: "#a89a86", display: "block", marginTop: 6 }}>Seuls les membres présents à ce moment jeux (et les administrateurs) peuvent modifier la liste des jeux joués.</span>
      )}

      {/* Fiche jeu ouverte au clic sur un jeu joué (permet de noter le jeu en direct) */}
      {openedGameId && (
        <GameDetailModal g={games.find((g) => g.id === openedGameId)} onClose={() => setOpenedGameId(null)} onAuth={() => {}} setToast={() => {}} />
      )}
    </div>
  );
}

/* ---- Modale : modifier un moment jeux (créateur/admin) ---- */
function EditEventModal({ e, onClose, onSave }) {
  const [f, setF] = useState({
    date: e.date, time: e.time, place: e.place, placeId: e.placeId || null, online: !!e.online, min: e.min, max: e.max || "",
    notes: e.notes || "", isPrivate: !!e.isPrivate,
    useDeadline: !!e.deadline,
    deadlineDate: e.deadline ? new Date(e.deadline).toISOString().slice(0, 10) : e.date,
    deadlineTime: e.deadline ? new Date(e.deadline).toTimeString().slice(0, 5) : "18:00",
    useSignupLimit: !!e.signupDeadline,
    signupDate: e.signupDeadline ? new Date(e.signupDeadline).toISOString().slice(0, 10) : e.date,
    signupTime: e.signupDeadline ? new Date(e.signupDeadline).toTimeString().slice(0, 5) : "18:00",
  });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setErr("");
    if (!f.date || !f.time || (!f.online && !f.place.trim())) { setErr("Renseignez la date, l'heure et le lieu."); return; }
    const minN = Number(f.min) || 1;
    const maxN = f.max === "" || f.max == null ? null : Number(f.max);
    if (maxN != null && minN > maxN) { setErr("Le minimum ne peut pas dépasser le maximum."); return; }
    let deadline = null;
    if (f.useDeadline && f.deadlineDate && f.deadlineTime) deadline = new Date(`${f.deadlineDate}T${f.deadlineTime}:00`).toISOString();
    let signupDeadline = null;
    if (f.useSignupLimit && f.signupDate && f.signupTime) {
      const sd = new Date(`${f.signupDate}T${f.signupTime}:00`);
      if (isNaN(sd.getTime())) { setErr("Date limite d'inscription invalide."); return; }
      signupDeadline = sd.toISOString();
    }
    setBusy(true);
    const res = await onSave({ date: f.date, time: f.time, place: f.online ? "Board Game Arena" : f.place.trim(), placeId: f.online ? null : f.placeId, online: f.online, min: minN, max: maxN, notes: f.notes.trim(), isPrivate: f.isPrivate, deadline, signupDeadline });
    setBusy(false);
    if (res?.error) setErr(res.error);
  };

  const today = new Date().toISOString().slice(0, 10);
  return (
    <Modal open onClose={onClose} title="Modifier le moment jeux" width={540}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <Field label="Jour"><TextInput type="date" value={f.date} onChange={(ev) => setF({ ...f, date: ev.target.value })} /></Field>
        <Field label="Heure"><TextInput type="time" value={f.time} onChange={(ev) => setF({ ...f, time: ev.target.value })} /></Field>
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        <button type="button" onClick={() => setF({ ...f, online: false, place: f.place === "Board Game Arena" ? "Local ALADJ — Gouville-sur-Mer" : f.place })}
          style={{ flex: 1, padding: "11px", borderRadius: 12, border: `2px solid ${!f.online ? C.teal : "#e6dcc9"}`, background: !f.online ? "rgba(30,138,138,.08)" : "#fff", color: C.navy, fontFamily: "'Fredoka',sans-serif", fontWeight: 700, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
          <MapPin size={16} /> En présentiel
        </button>
        <button type="button" onClick={() => setF({ ...f, online: true, place: "Board Game Arena", placeId: null })}
          style={{ flex: 1, padding: "11px", borderRadius: 12, border: `2px solid ${f.online ? C.purple : "#e6dcc9"}`, background: f.online ? "rgba(107,58,122,.08)" : "#fff", color: C.navy, fontFamily: "'Fredoka',sans-serif", fontWeight: 700, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
          <Globe size={16} /> En ligne (BGA)
        </button>
      </div>
      {f.online ? (
        <a href={SIGNAL_GROUPS.find((g) => g.name === "Jeux en ligne")?.url} target="_blank" rel="noopener noreferrer"
          style={{ display: "flex", alignItems: "center", gap: 9, padding: "12px 14px", borderRadius: 12, background: "rgba(107,58,122,.08)", color: C.navy, fontSize: 13.5, lineHeight: 1.45, marginBottom: 14, textDecoration: "none", border: `1.5px solid ${C.purple}33`, cursor: "pointer" }}>
          <Globe size={18} color={C.purple} style={{ flexShrink: 0 }} /> <span>Sur <b>&nbsp;Board Game Arena&nbsp;</b> — rendez-vous sur la conversation Signal «&nbsp;Jeux en ligne&nbsp;» à l'heure indiquée <b style={{ color: C.purple }}>(cliquez sur ce bandeau pour la rejoindre)</b>. <b>Jeux gratuits pour tous les participants</b> (compte premium de l'association).</span>
        </a>
      ) : (
        <PlaceSelector value={f.place} placeId={f.placeId} onChange={({ place, placeId }) => setF({ ...f, place, placeId })} />
      )}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <Field label="Joueurs min."><TextInput type="number" min={1} value={f.min} onChange={(ev) => setF({ ...f, min: ev.target.value })} /></Field>
        <Field label="Joueurs max." hint="Vide = illimité"><TextInput type="number" min={1} value={f.max} onChange={(ev) => setF({ ...f, max: ev.target.value })} placeholder="illimité" /></Field>
      </div>
      <label style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "11px 14px", borderRadius: 12, background: f.isPrivate ? "rgba(107,58,122,.1)" : "rgba(26,58,92,.05)", border: `1.5px solid ${f.isPrivate ? C.purple : "transparent"}`, marginBottom: 14, cursor: "pointer" }}>
        <input type="checkbox" checked={f.isPrivate} onChange={(ev) => setF({ ...f, isPrivate: ev.target.checked })} style={{ width: 18, height: 18, accentColor: C.purple, marginTop: 2, flexShrink: 0 }} />
        <span style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 600, color: C.navy, fontSize: 14 }}>
          <Lock size={14} style={{ verticalAlign: "-2px", marginRight: 5, color: f.isPrivate ? C.purple : "#9c8d79" }} />
          Moment jeux privé
          <span style={{ display: "block", fontSize: 12.5, color: "#8a7c6a", fontWeight: 400, lineHeight: 1.5, marginTop: 3 }}>
            Visible uniquement par les membres conviés (créateur, inscrits, invités). Les administrateurs le voient en grisé.
          </span>
        </span>
      </label>
      <label style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 12, background: "rgba(232,163,23,.1)", marginBottom: f.useDeadline ? 12 : 14, cursor: "pointer" }}>
        <input type="checkbox" checked={f.useDeadline} onChange={(ev) => setF({ ...f, useDeadline: ev.target.checked })} style={{ width: 18, height: 18, accentColor: C.amber }} />
        <span style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 600, color: C.navy, fontSize: 14 }}>Date limite de validation</span>
      </label>
      {f.useDeadline && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <Field label="Valable jusqu'au"><TextInput type="date" value={f.deadlineDate} onChange={(ev) => setF({ ...f, deadlineDate: ev.target.value })} /></Field>
          <Field label="à"><TextInput type="time" value={f.deadlineTime} onChange={(ev) => setF({ ...f, deadlineTime: ev.target.value })} /></Field>
        </div>
      )}
      <label style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 12, background: "rgba(30,138,138,.1)", marginBottom: f.useSignupLimit ? 12 : 14, cursor: "pointer" }}>
        <input type="checkbox" checked={f.useSignupLimit} onChange={(ev) => setF({ ...f, useSignupLimit: ev.target.checked })} style={{ width: 18, height: 18, accentColor: C.teal }} />
        <span style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 600, color: C.navy, fontSize: 14 }}>
          <Clock size={14} style={{ verticalAlign: "-2px", marginRight: 5, color: f.useSignupLimit ? C.teal : "#9c8d79" }} /> Limite d'inscription
        </span>
      </label>
      {f.useSignupLimit && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <Field label="Inscriptions jusqu'au"><TextInput type="date" value={f.signupDate} onChange={(ev) => setF({ ...f, signupDate: ev.target.value })} /></Field>
          <Field label="à"><TextInput type="time" value={f.signupTime} onChange={(ev) => setF({ ...f, signupTime: ev.target.value })} /></Field>
        </div>
      )}
      <Field label="Note"><textarea value={f.notes} onChange={(ev) => setF({ ...f, notes: ev.target.value })} rows={2} style={{ ...inputStyle, resize: "vertical" }} /></Field>
      {err && <div style={{ background: "rgba(181,40,58,.1)", color: C.red, padding: "10px 14px", borderRadius: 11, fontSize: 13.5, fontWeight: 600, marginBottom: 14 }}>{err}</div>}
      <Btn full size="lg" onClick={submit} disabled={busy}>{busy ? <Loader2 size={18} className="aladj-spin" /> : <><Check size={18} /> Enregistrer les modifications</>}</Btn>
    </Modal>
  );
}

/* ---- Modale : partager le moment jeux sur Signal (message prêt à copier) ---- */
function ShareEventModal({ event, onClose }) {
  const [copied, setCopied] = useState(false);
  // Moment en ligne → conversation « Jeux en ligne » ; présentiel → « Organisation jeux ».
  const groupName = event.online ? "Jeux en ligne" : "Organisation jeux";
  const orga = SIGNAL_GROUPS.find((g) => g.name === groupName);
  const siteUrl = "https://aladj.fr";

  const deadlineTxt = event.deadline
    ? `\n⏳ À valider avant le ${formatDateFr(new Date(event.deadline).toISOString().slice(0,10))} à ${new Date(event.deadline).toTimeString().slice(0,5)}`
    : "";
  const message =
`🎲 Nouveau moment jeux !

📅 ${formatDateFr(event.date)} à ${event.time}
📍 ${event.place}
👥 ${event.min} à ${event.max} joueurs${deadlineTxt}${event.notes ? `\n📝 ${event.notes}` : ""}

➡️ Inscriptions et détails : ${siteUrl}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      // repli : sélection manuelle
      setCopied(false);
    }
  };

  return (
    <Modal open onClose={onClose} title="Partager ce moment jeux" width={520}>
      <p style={{ fontSize: 14, color: "#6e6256", margin: "0 0 16px", lineHeight: 1.5 }}>
        Votre moment jeux est créé ! Copiez ce message et collez-le dans le groupe Signal «&nbsp;{groupName}&nbsp;» pour prévenir les membres.
      </p>
      <div style={{ background: "rgba(26,58,92,.04)", border: "1px solid #ece2d0", borderRadius: 13, padding: 16, fontSize: 13.5, color: "#3a3a3a", whiteSpace: "pre-line", lineHeight: 1.5, marginBottom: 16, fontFamily: "'Nunito',sans-serif" }}>
        {message}
      </div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <Btn variant={copied ? "teal" : "primary"} size="lg" onClick={copy} style={{ flex: 1 }}>
          {copied ? <><Check size={17} /> Copié !</> : <><PenLine size={17} /> Copier le message</>}
        </Btn>
        {orga && (
          <a href={orga.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", flex: 1 }}>
            <Btn variant="soft" size="lg" full><ExternalLink size={17} /> Ouvrir Signal</Btn>
          </a>
        )}
      </div>
      <button onClick={onClose} style={{ width: "100%", marginTop: 12, background: "none", border: "none", color: "#9c8d79", cursor: "pointer", fontSize: 13.5, fontFamily: "'Nunito',sans-serif" }}>
        Plus tard
      </button>
    </Modal>
  );
}

/* ---- Modale : infos d'accès d'un lieu (+ édition par le créateur/admin) ---- */
function PlaceInfoModal({ place, onClose, startEditing = false }) {
  const { currentUser, updatePlace } = useApp();
  const canEdit = currentUser && (currentUser.id === place.createdBy || currentUser.admin);
  const [editing, setEditing] = useState(startEditing && canEdit);
  const [f, setF] = useState({ name: place.name, address: place.address, accessInfo: place.accessInfo });
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true); await updatePlace(place.id, f); setBusy(false); setEditing(false);
  };

  return (
    <Modal open onClose={onClose} title={editing ? "Modifier le lieu" : place.name} width={480}>
      {editing ? (
        <div>
          <Field label="Nom du lieu"><TextInput value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
          <Field label="Adresse exacte"><TextInput value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} /></Field>
          <Field label="Accès & stationnement"><textarea value={f.accessInfo} onChange={(e) => setF({ ...f, accessInfo: e.target.value })} rows={3} style={{ ...inputStyle, resize: "vertical" }} /></Field>
          <div style={{ display: "flex", gap: 8 }}>
            <Btn variant="teal" onClick={save} disabled={busy}>{busy ? <Loader2 size={16} className="aladj-spin" /> : <><Check size={16} /> Enregistrer</>}</Btn>
            <Btn variant="soft" onClick={() => setEditing(false)}>Annuler</Btn>
          </div>
        </div>
      ) : (
        <div>
          {place.address && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 600, color: C.navy, fontSize: 13.5, marginBottom: 3 }}><MapPin size={14} style={{ verticalAlign: "-2px" }} /> Adresse</div>
              <div style={{ fontSize: 14.5, color: "#5e5346", lineHeight: 1.5 }}>{place.address}</div>
            </div>
          )}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 600, color: C.navy, fontSize: 13.5, marginBottom: 3 }}>🅿️ Accès & stationnement</div>
            <div style={{ fontSize: 14.5, color: "#5e5346", lineHeight: 1.5, whiteSpace: "pre-line" }}>{place.accessInfo || "Pas d'information d'accès pour ce lieu."}</div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #f0e8d8", paddingTop: 14, marginTop: 4 }}>
            <span style={{ fontSize: 12.5, color: "#9c8d79" }}>Lieu créé par {place.createdByName}</span>
            {canEdit && <Btn size="sm" variant="soft" onClick={() => setEditing(true)}><Edit3 size={14} /> Modifier</Btn>}
          </div>
        </div>
      )}
    </Modal>
  );
}

/* ---- Variante "inline" : collecte un invité sans toucher la base (pour la création) ---- */
function GuestAdderInline({ users, excludeIds = [], onAdd, onCancel }) {
  const [mode, setMode] = useState("guest");
  const [name, setName] = useState("");
  const [memberId, setMemberId] = useState("");
  const availableMembers = users.filter((u) => !excludeIds.includes(u.id));

  const submit = () => {
    if (mode === "member" && memberId) {
      const m = users.find((u) => u.id === memberId);
      onAdd(m.name, memberId);
    } else if (mode === "guest" && name.trim()) {
      onAdd(name.trim(), null);
    }
  };

  return (
    <div style={{ background: "rgba(107,58,122,.06)", borderRadius: 14, padding: 14, border: "1px solid rgba(107,58,122,.2)" }}>
      <div style={{ display: "flex", gap: 6, marginBottom: 12, background: "#fff", padding: 4, borderRadius: 10 }}>
        {[["guest", "Invité sans compte"], ["member", "Membre du site"]].map(([k, lbl]) => (
          <button key={k} type="button" onClick={() => setMode(k)} style={{ flex: 1, padding: "7px", border: "none", borderRadius: 8, cursor: "pointer", fontFamily: "'Fredoka',sans-serif", fontWeight: 700, fontSize: 12.5, background: mode === k ? C.purple : "transparent", color: mode === k ? "#fff" : "#9c8d79" }}>{lbl}</button>
        ))}
      </div>
      {mode === "guest" ? (
        <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="Nom de l'invité (ex. conjoint, enfant...)" style={{ marginBottom: 10 }} />
      ) : (
        <select value={memberId} onChange={(e) => setMemberId(e.target.value)} style={{ ...inputStyle, marginBottom: 10, cursor: "pointer" }}>
          <option value="">Choisir un membre...</option>
          {availableMembers.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
      )}
      <div style={{ display: "flex", gap: 8 }}>
        <Btn size="sm" variant="teal" onClick={submit} disabled={mode === "guest" ? !name.trim() : !memberId}><Check size={14} /> Ajouter</Btn>
        <Btn size="sm" variant="soft" onClick={onCancel}>Annuler</Btn>
      </div>
    </div>
  );
}

/* ---- Sous-composant : ajouter un invité (membre OU sans compte) ---- */
function GuestAdder({ users, currentEvent, onAdd, onDone }) {
  const [mode, setMode] = useState("guest"); // "guest" (sans compte) | "member"
  const [name, setName] = useState("");
  const [memberId, setMemberId] = useState("");
  const [busy, setBusy] = useState(false);

  // membres pas déjà inscrits/invités
  const alreadyIn = new Set([...currentEvent.players.map((p) => p.id), ...(currentEvent.guests || []).map((g) => g.memberId).filter(Boolean)]);
  const availableMembers = users.filter((u) => !alreadyIn.has(u.id));

  const submit = async () => {
    setBusy(true);
    if (mode === "member" && memberId) {
      const m = users.find((u) => u.id === memberId);
      await onAdd(currentEvent.id, m.name, memberId);
    } else if (mode === "guest" && name.trim()) {
      await onAdd(currentEvent.id, name.trim(), null);
    }
    setBusy(false); onDone();
  };

  return (
    <div style={{ background: "rgba(107,58,122,.06)", borderRadius: 14, padding: 14, border: "1px solid rgba(107,58,122,.2)" }}>
      <div style={{ display: "flex", gap: 6, marginBottom: 12, background: "#fff", padding: 4, borderRadius: 10 }}>
        {[["guest", "Invité sans compte"], ["member", "Membre du site"]].map(([k, lbl]) => (
          <button key={k} onClick={() => setMode(k)} style={{ flex: 1, padding: "7px", border: "none", borderRadius: 8, cursor: "pointer", fontFamily: "'Fredoka',sans-serif", fontWeight: 700, fontSize: 12.5, background: mode === k ? C.purple : "transparent", color: mode === k ? "#fff" : "#9c8d79" }}>{lbl}</button>
        ))}
      </div>
      {mode === "guest" ? (
        <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="Nom de l'invité (ex. conjoint, enfant...)" style={{ marginBottom: 10 }} />
      ) : (
        <select value={memberId} onChange={(e) => setMemberId(e.target.value)} style={{ ...inputStyle, marginBottom: 10, cursor: "pointer" }}>
          <option value="">Choisir un membre...</option>
          {availableMembers.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
      )}
      <div style={{ display: "flex", gap: 8 }}>
        <Btn size="sm" variant="teal" onClick={submit} disabled={busy || (mode === "guest" ? !name.trim() : !memberId)}>{busy ? <Loader2 size={14} className="aladj-spin" /> : <><Check size={14} /> Ajouter</>}</Btn>
        <Btn size="sm" variant="soft" onClick={onDone}>Annuler</Btn>
      </div>
    </div>
  );
}

/* =============================================================================
   CARTE DE JEU + DÉTAIL
   ============================================================================= */
function GameCover({ g, size = "md" }) {
  const heights = { sm: 56, md: 150, lg: 220 };
  const h = heights[size];
  const [imgError, setImgError] = useState(false);
  // placeholder coloré (utilisé si pas d'image OU si l'image ne charge pas)
  const palette = [C.teal, C.amber, C.red, C.purple, C.navy];
  const col = palette[(g.name.charCodeAt(0) + (g.name.length || 0)) % palette.length];
  // Fiche de référence (personne ne possède ce jeu) : vignette désaturée, pour
  // qu'on repère d'un coup d'oeil ce qui n'est pas dans la ludothèque de l'asso.
  const dim = g.unowned === true;
  const dimStyle = dim ? { filter: size === "lg" ? "grayscale(.8)" : "grayscale(1)", opacity: size === "lg" ? .82 : .7 } : null;

  if (g.img && !imgError) {
    return (
      <div style={{ height: h, position: "relative", borderRadius: size === "sm" ? 10 : 0, overflow: "hidden", background: "#11202f", ...dimStyle }}>
        <img src={g.img} alt={g.name} onError={() => setImgError(true)}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
      </div>
    );
  }
  return (
    <div style={{ height: h, background: dim ? "linear-gradient(135deg, #a9a099, #837a72)" : `linear-gradient(135deg, ${col}, ${col}cc)`, display: "grid", placeItems: "center", borderRadius: size === "sm" ? 10 : 0, position: "relative", overflow: "hidden", ...(dim ? { opacity: .9 } : null) }}>
      <Dice color="rgba(255,255,255,.25)" n={(g.name.length % 6) + 1} style={{ position: "absolute", width: h * 0.55, right: -h * 0.1, bottom: -h * 0.12, transform: "rotate(12deg)" }} />
      <span style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 700, color: "#fff", fontSize: size === "sm" ? 18 : 34, textAlign: "center", padding: 8, lineHeight: 1, textShadow: "0 2px 8px rgba(0,0,0,.25)", zIndex: 1 }}>
        {g.name.split(" ").slice(0, 3).map((w) => w[0]).join("").toUpperCase().slice(0, 3)}
      </span>
    </div>
  );
}

// Pastille "ceinture" du tenant du titre : anneau doré, photo au centre,
// "CHAMPION" en arc ; le nom du vainqueur et la date apparaissent au survol.
function ChampionBelt({ belt, size = 46 }) {
  if (!belt || !(belt.winners || []).length) return null;
  const main = belt.winners[0];
  const names = belt.winners.map((w) => w.name).join(", ");
  const dateStr = new Date(belt.playedAt).toLocaleDateString("fr-FR");
  const title = `Tenant du titre : ${names} — ${dateStr}`;
  const r = size / 2;
  const photoR = size * 0.27;
  const rr = r - size * 0.10;
  const uid = "blt" + Math.abs(((main.userId || main.name || "x") + size).split("").reduce((a, c) => a + c.charCodeAt(0), 0));
  const arc = `M ${r - rr} ${r} A ${rr} ${rr} 0 0 1 ${r + rr} ${r}`;
  return (
    <span title={title} style={{ display: "inline-block", lineHeight: 0, filter: "drop-shadow(0 2px 4px rgba(0,0,0,.35))" }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id={uid + "g"} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FBE38A" /><stop offset="45%" stopColor="#E8A317" /><stop offset="100%" stopColor="#A9700A" />
          </linearGradient>
          <clipPath id={uid + "c"}><circle cx={r} cy={r} r={photoR} /></clipPath>
          <path id={uid + "p"} d={arc} fill="none" />
        </defs>
        <circle cx={r} cy={r} r={r - 0.8} fill={`url(#${uid}g)`} stroke="#8a5800" strokeWidth="1" />
        <circle cx={r} cy={r} r={photoR + 2} fill="#fff" />
        {main.avatar
          ? <image href={main.avatar} x={r - photoR} y={r - photoR} width={photoR * 2} height={photoR * 2} clipPath={`url(#${uid}c)`} preserveAspectRatio="xMidYMid slice" />
          : <g><circle cx={r} cy={r} r={photoR} fill="#1E8A8A" /><text x={r} y={r} textAnchor="middle" dominantBaseline="central" fill="#fff" fontFamily="Fredoka, sans-serif" fontWeight="700" fontSize={photoR}>{(main.name || "?")[0].toUpperCase()}</text></g>}
        <text fill="#6e4500" fontFamily="Fredoka, sans-serif" fontWeight="700" fontSize={size * 0.135} letterSpacing="0.3">
          <textPath href={`#${uid}p`} startOffset="50%" textAnchor="middle" dominantBaseline="central">★ CHAMPION ★</textPath>
        </text>
      </svg>
    </span>
  );
}

function GameCard({ g, onOpen, myGame, globalShare, onToggleShare, showBoth, ownerBadge = null }) {
  const { currentUser, beltByGame } = useApp();
  const belt = beltByGame?.[g.id];
  const { avg, count } = gameStats(g);
  const isShared = g.shared !== false;
  const myRating = currentUser ? (g.ratings?.[currentUser.id] || 0) : 0;
  const iVoted = myRating > 0;

  // Badge : dans "ma ludothèque" → ma note ; dans la générale → moyenne (couleur selon si j'ai voté)
  let badgeBg, badgeContent;
  if (myGame) {
    badgeBg = iVoted ? "rgba(232,163,23,.95)" : "rgba(18,41,63,.6)";
    badgeContent = iVoted
      ? <><Star size={13} fill="#fff" color="#fff" /> {String(myRating).replace(".", ",")}</>
      : <span style={{ fontSize: 11.5 }}>À noter</span>;
  } else {
    // ludothèque générale : moyenne ; turquoise si j'ai voté, foncé sinon
    badgeBg = iVoted ? "rgba(30,138,138,.95)" : "rgba(18,41,63,.85)";
    badgeContent = <><Star size={13} fill={C.amber} color={C.amber} /> {count ? avg.toFixed(2).replace(".", ",") : "—"}</>;
  }

  // Mode "deux notes" : on affiche la moyenne (ambre) en haut à droite,
  // et juste en dessous la note personnelle (turquoise) si l'utilisateur est connecté.
  const bothNotes = showBoth && currentUser;

  return (
    <div style={{ position: "relative", minWidth: 0 }}>
      <button onClick={onOpen} style={{ width: "100%", minWidth: 0, textAlign: "left", cursor: "pointer", border: "1px solid #ece2d0", borderRadius: 18, overflow: "hidden", padding: 0, background: C.paper, boxShadow: "0 4px 16px rgba(18,41,63,.05)", transition: "transform .15s, box-shadow .2s" }}
        onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 12px 30px rgba(18,41,63,.12)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(18,41,63,.05)"; }}>
        <div style={{ position: "relative" }}>
          <GameCover g={g} />
          {(g.wantIds || []).length > 0 && (
            <div title={`${g.wantIds.length} membre${g.wantIds.length > 1 ? "s veulent" : " veut"} découvrir ce jeu`}
              style={{ position: "absolute", top: g.unowned ? 40 : 10, left: 10, background: C.red, color: "#fff", borderRadius: 999, padding: "4px 9px 4px 7px", fontFamily: "'Fredoka',sans-serif", fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", gap: 4, boxShadow: "0 2px 6px rgba(0,0,0,.18)" }}>
              <Heart size={13} fill="#fff" color="#fff" /> {g.wantIds.length}
            </div>
          )}
          {g.unowned && (
            <div title="Fiche de référence : aucun membre ne possède ce jeu. Elle sert à enregistrer des parties (Board Game Arena, convention, joueurs extérieurs…)."
              style={{ position: "absolute", top: 10, left: 10, background: "rgba(94,83,70,.92)", color: "#fff", borderRadius: 999, padding: "3px 10px", fontFamily: "'Fredoka',sans-serif", fontWeight: 700, fontSize: 11.5, letterSpacing: .2, boxShadow: "0 2px 6px rgba(0,0,0,.2)" }}>
              Fiche de référence
            </div>
          )}
          {ownerBadge && (
            <div title={`Appartient à ${ownerBadge}`}
              style={{ position: "absolute", bottom: belt ? 62 : 10, left: 10, background: "rgba(107,58,122,.92)", color: "#fff", borderRadius: 999, padding: "3px 10px 3px 8px", fontFamily: "'Fredoka',sans-serif", fontWeight: 700, fontSize: 12, display: "flex", alignItems: "center", gap: 4, boxShadow: "0 2px 6px rgba(0,0,0,.2)" }}>
              <Users size={12} color="#fff" /> {ownerBadge}
            </div>
          )}
          {belt && (
            <div style={{ position: "absolute", bottom: 8, left: 8 }}>
              <ChampionBelt belt={belt} size={46} />
            </div>
          )}
          {bothNotes ? (
            // Deux badges empilés : moyenne (ambre) puis ma note (turquoise)
            <div style={{ position: "absolute", top: 10, right: 10, display: "flex", flexDirection: "column", gap: 5, alignItems: "flex-end" }}>
              <div title="Note moyenne de l'association" style={{ background: "rgba(232,163,23,.95)", color: "#fff", borderRadius: 999, padding: "4px 10px", fontFamily: "'Fredoka',sans-serif", fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", gap: 4 }}>
                <Star size={13} fill="#fff" color="#fff" /> {count ? avg.toFixed(2).replace(".", ",") : "—"}
              </div>
              <div title={iVoted ? "Votre note" : "Vous n'avez pas encore noté ce jeu"} style={{ background: iVoted ? "rgba(30,138,138,.95)" : "rgba(18,41,63,.6)", color: "#fff", borderRadius: 999, padding: "4px 10px", fontFamily: "'Fredoka',sans-serif", fontWeight: 700, fontSize: 12.5, display: "flex", alignItems: "center", gap: 4 }}>
                {iVoted ? <><Heart size={11} fill="#fff" color="#fff" /> {String(myRating).replace(".", ",")}</> : <span style={{ fontSize: 11 }}>non noté</span>}
              </div>
            </div>
          ) : (
            <div title={myGame ? (iVoted ? "Votre note" : "Vous n'avez pas encore noté ce jeu") : (iVoted ? "Moyenne — vous avez voté" : "Moyenne — vous n'avez pas encore voté")}
              style={{ position: "absolute", top: 10, right: 10, background: badgeBg, color: "#fff", borderRadius: 999, padding: "4px 10px", fontFamily: "'Fredoka',sans-serif", fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", gap: 4 }}>
              {badgeContent}
            </div>
          )}
        </div>
        <div style={{ padding: 16 }}>
          <h3 style={{ fontFamily: "'Fredoka',sans-serif", color: C.navy, fontSize: 17, margin: "0 0 4px", lineHeight: 1.15, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{g.name}</h3>
          <div style={{ display: "flex", gap: 10, color: "#8a7c6a", fontSize: 12.5, marginBottom: 10, flexWrap: "wrap" }}>
            {g.min && <span><Users size={12} style={{ verticalAlign: "-1px" }} /> {g.min}{g.max && g.max !== g.min ? `-${g.max}` : ""}</span>}
            {g.time && <span><Clock size={12} style={{ verticalAlign: "-1px" }} /> {g.time} min</span>}
            {g.year && <span>{g.year}</span>}
          </div>
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 10 }}>
            {(g.mechanics || []).slice(0, 2).map((m, i) => <Badge key={i} color={C.purple}>{m}</Badge>)}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #f0e8d8", paddingTop: 10 }}>
            <span style={{ fontSize: 12, color: "#9c8d79" }}>{(() => {
              // Affichage : possesseurs confirmés en priorité, puis pendings avec mention "X selon Y"
              const confirmed = (g.confirmedOwners || g.owners || []).map((o) => ({ name: o.name }));
              const pending = (g.pendingOwners || []).map((o) => ({ name: o.name, declaredByName: o.declaredByName }));
              const all = [...confirmed, ...pending];
              // Personne ne le possède : on le dit, plutôt que de désigner l'auteur de la fiche.
              if (all.length === 0) return <i style={{ color: "#a89a86" }}>Fiche de référence</i>;
              const shown = all.slice(0, 2).map((o) => o.declaredByName ? `${o.name} selon ${o.declaredByName}` : o.name).join(", ");
              const extra = all.length - 2;
              return <>chez <b style={{ color: C.teal }}>{shown}</b>{extra > 0 ? ` +${extra}` : ""}</>;
            })()}</span>
            <span style={{ fontSize: 11.5, color: "#8a7c6a", fontWeight: 700, fontFamily: "'Fredoka',sans-serif" }}>{count} vote{count > 1 ? "s" : ""}</span>
          </div>
        </div>
      </button>
      {/* Badge de partage (uniquement sur mes propres jeux) — placé en bas à gauche
          pour ne pas masquer le badge cœur des envies de découverte (en haut à gauche). */}
      {myGame && (
        <button
          onClick={(e) => { e.stopPropagation(); onToggleShare(!isShared); }}
          title={!globalShare ? "Votre ludothèque est privée (réglage global)" : isShared ? "Partagé dans la ludothèque commune — cliquez pour rendre privé" : "Privé — cliquez pour partager"}
          disabled={!globalShare}
          style={{
            position: "absolute", top: 130, left: 10, border: "none", borderRadius: 999, padding: "5px 11px", fontSize: 11.5, fontFamily: "'Fredoka',sans-serif", fontWeight: 700,
            cursor: globalShare ? "pointer" : "not-allowed", display: "flex", alignItems: "center", gap: 5,
            background: !globalShare ? "rgba(120,110,95,.85)" : isShared ? "rgba(30,138,138,.92)" : "rgba(120,110,95,.85)", color: "#fff",
            boxShadow: "0 2px 8px rgba(0,0,0,.15)",
          }}>
          {!globalShare ? <><EyeOff size={12} /> Privé</> : isShared ? <><Check size={12} /> Partagé</> : <><EyeOff size={12} /> Privé</>}
        </button>
      )}
    </div>
  );
}

function fmtDuration(s) {
  if (s == null) return "—";
  const m = Math.round(s / 60);
  if (m < 1) return "< 1 min";
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60), mm = m % 60;
  return mm ? `${h} h ${String(mm).padStart(2, "0")}` : `${h} h`;
}

function SessionsModal({ sessions, gameName, game, canDelete, onClose, onDeleted }) {
  const { askConfirm, plays } = useApp();
  const [busyId, setBusyId] = useState(null);
  const [openId, setOpenId] = useState(null); // partie dépliée (affichage des scores)
  // On retrouve les participants (et leurs scores) dans les parties déjà chargées.
  const playById = useMemo(() => { const m = {}; (plays || []).forEach((pl) => { m[pl.id] = pl; }); return m; }, [plays]);
  const del = async (id) => {
    if (!(await askConfirm({ title: "Écarter cette partie ?", message: "Cette partie sera écartée des statistiques. Action définitive.", confirmLabel: "Écarter" }))) return;
    setBusyId(id);
    const { error } = await supabase.rpc("delete_game_play", { p_play_id: id });
    setBusyId(null);
    if (error) { alert(error.message); return; }
    onDeleted && onDeleted();
  };
  return (
    <Modal open onClose={onClose} title={`Parties — ${gameName}`}>
      {!sessions || sessions.length === 0 ? (
        <div style={{ textAlign: "center", padding: 20, color: "#9c8d79" }}>Aucune partie chronométrée pour l'instant.</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr)", gap: 10 }}>
          {sessions.map((r) => {
            const pl = playById[r.play_id];
            const hasScores = !!pl && (pl.participants || []).some((pt) => pt.score != null && pt.confirmed !== false);
            const open = openId === r.play_id;
            return (
              <div key={r.play_id} style={{ background: C.paper, border: "1px solid #ece2d0", borderRadius: 12, padding: "11px 14px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                  <button onClick={() => hasScores && setOpenId(open ? null : r.play_id)} disabled={!hasScores}
                    title={hasScores ? "Voir les scores de cette partie" : undefined}
                    style={{ flex: 1, minWidth: 0, textAlign: "left", background: "none", border: "none", padding: 0, cursor: hasScores ? "pointer" : "default" }}>
                    <div style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 700, color: C.navy, fontSize: 15 }}>{fmtDuration(r.duration_seconds)} <span style={{ fontWeight: 400, color: "#8a7c6a", fontSize: 13 }}>· {r.player_count} joueur{r.player_count > 1 ? "s" : ""}</span></div>
                    <div style={{ fontSize: 12.5, color: "#8a7c6a", display: "flex", alignItems: "center", gap: 6 }}>
                      {formatDateFr(new Date(r.played_at).toISOString().slice(0, 10))}
                      {hasScores && <span style={{ color: C.teal, fontWeight: 700 }}>· scores {open ? "▾" : "▸"}</span>}
                    </div>
                  </button>
                  {canDelete && (
                    <button onClick={() => del(r.play_id)} disabled={busyId === r.play_id}
                      style={{ background: "rgba(181,40,58,.1)", border: "none", borderRadius: 9, padding: "7px 9px", cursor: "pointer", color: C.red, display: "grid", placeItems: "center" }} title="Écarter cette partie">
                      {busyId === r.session_id ? <Loader2 size={15} className="aladj-spin" /> : <Trash2 size={15} />}
                    </button>
                  )}
                </div>
                {open && pl && <PlayScoreBoard play={pl} game={game} compact />}
              </div>
            );
          })}
        </div>
      )}
      {canDelete && sessions && sessions.length > 0 && (
        <p style={{ fontSize: 12.5, color: "#9c8d79", marginTop: 14, marginBottom: 0 }}>Écartez les parties non représentatives (chrono oublié, partie interrompue…) pour affiner les moyennes.</p>
      )}
    </Modal>
  );
}

function GameDetailModal({ g, onClose, onAuth, setToast }) {
  const { currentUser, rateGame, clearRating, removeGame, updateGame, users, addOwner, removeOwner, declareOwners, toggleDiscover, openChrono, plays, beltByGame, askConfirm } = useApp();
  const { avg, count } = gameStats(g);
  const myRating = currentUser ? (g.ratings?.[currentUser.id] || 0) : 0;
  // Aucun repli sur g.ownerId : ce champ designe l'auteur de la fiche, pas un
  // possesseur. Une liste vide signifie bien « personne ne possede ce jeu ».
  const confirmedOwners = (g.confirmedOwners && g.confirmedOwners.length ? g.confirmedOwners : g.owners) || [];
  const pendingOwners = g.pendingOwners || [];
  const owners = confirmedOwners;
  const isOwner = currentUser && confirmedOwners.some((o) => o.id === currentUser.id);
  // Fiche de reference : aucun proprietaire confirme.
  const unowned = confirmedOwners.length === 0;
  // Une fiche sans proprietaire n'appartient a personne : elle est entretenue
  // collectivement (le serveur applique la meme regle, cf. migration lot E).
  const canManage = currentUser && (isOwner || currentUser.admin || unowned);
  const [editing, setEditing] = useState(false);
  const [showVoters, setShowVoters] = useState(false);
  const [showScale, setShowScale] = useState(false); // rappel de l'echelle de notation ALADJ
  const [showRules, setShowRules] = useState(false); // points de regle du jeu
  const [ruleCount, setRuleCount] = useState(null);  // null = pas encore compte
  const [showSessions, setShowSessions] = useState(false);
  const [histOpen, setHistOpen] = useState(false);
  const [sessions, setSessions] = useState(null);
  const [myAvg, setMyAvg] = useState(null);
  const [allAvg, setAllAvg] = useState(null);
  const [setupAvg, setSetupAvg] = useState(null);
  const [teardownAvg, setTeardownAvg] = useState(null);
  const [declaring, setDeclaring] = useState(false);
  const [selDeclare, setSelDeclare] = useState([]);
  const [declBusy, setDeclBusy] = useState(false);
  const ownerIdSet = new Set([...confirmedOwners.map((o) => o.id), ...pendingOwners.map((o) => o.id)]);
  const myGamePlays = (currentUser ? (plays || []).filter((pl) => pl.gameId === g.id && pl.participants.some((pt) => pt.userId === currentUser.id && pt.confirmed !== false)) : []).sort((a, b) => new Date(b.playedAt) - new Date(a.playedAt));

  // Statistiques de points : moyenne d'une partie, moyenne personnelle,
  // record toutes parties confondues et record personnel.
  // Rien n'est affiché tant qu'aucun score n'a été enregistré.
  const scoreStats = useMemo(() => {
    const dir = scoreDirOf(g);
    const all = [];
    const mine = [];
    (plays || []).forEach((pl) => {
      if (pl.gameId !== g.id) return;
      (pl.participants || []).forEach((pt) => {
        if (pt.score == null || pt.confirmed === false) return;
        const row = { score: pt.score, name: pt.name, playedAt: pl.playedAt };
        all.push(row);
        if (currentUser && pt.userId === currentUser.id) mine.push(row);
      });
    });
    if (!all.length) return null;
    const better = (a, b) => (dir === "low" ? b.score < a.score : b.score > a.score);
    const best = all.reduce((a, b) => (better(a, b) ? b : a));
    const myBest = mine.length ? mine.reduce((a, b) => (better(a, b) ? b : a)) : null;
    return {
      dir,
      count: all.length,
      avg: all.reduce((s, x) => s + x.score, 0) / all.length,
      best,
      myCount: mine.length,
      myAvg: mine.length ? mine.reduce((s, x) => s + x.score, 0) / mine.length : null,
      myBest,
    };
  }, [plays, g.id, g.scoreDirection, currentUser]);
  const myWinCount = currentUser ? myGamePlays.filter((pl) => pl.participants.some((pt) => pt.userId === currentUser.id && pt.isWinner)).length : 0;
  const winPct = myGamePlays.length ? Math.round((myWinCount / myGamePlays.length) * 100) : 0;
  const belt = beltByGame?.[g.id];
  const declarableUsers = (users || []).filter((u) => !u.banned && u.id !== currentUser?.id && !ownerIdSet.has(u.id));

  // La description n'est pas chargée dans le listing (pour alléger l'Egress) :
  // on la récupère à la demande, uniquement quand la fiche est ouverte.
  const [desc, setDesc] = useState(g.desc || "");
  useEffect(() => {
    let cancelled = false;
    // Si la description n'est pas déjà connue, on la charge pour ce seul jeu.
    if (!g.desc && g.id) {
      supabase.from("games").select("description").eq("id", g.id).single()
        .then(({ data }) => { if (!cancelled && data) setDesc(data.description || ""); });
    }
    return () => { cancelled = true; };
  }, [g.id, g.desc]);

  // Statistiques de durée des parties chronométrées (chargées à l'ouverture de la fiche).
  const loadStats = useCallback(async () => {
    const { data: ss } = await supabase.from("v_game_play_durations").select("play_id,played_at,duration_seconds,player_count").eq("game_id", g.id).order("played_at", { ascending: false });
    setSessions(ss || []);
    const { data: all } = await supabase.from("v_game_avg_player_time").select("avg_player_seconds").eq("game_id", g.id).maybeSingle();
    setAllAvg(all?.avg_player_seconds ?? null);
    const { data: ph } = await supabase.from("v_game_phase_time").select("avg_setup_seconds,avg_teardown_seconds").eq("game_id", g.id).maybeSingle();
    setSetupAvg(ph?.avg_setup_seconds ?? null);
    setTeardownAvg(ph?.avg_teardown_seconds ?? null);
    if (currentUser) {
      const { data: m } = await supabase.from("v_game_player_time").select("avg_player_seconds").eq("game_id", g.id).eq("profile_id", currentUser.id).maybeSingle();
      setMyAvg(m?.avg_player_seconds ?? null);
    }
  }, [g.id, currentUser]);
  useEffect(() => { loadStats(); }, [loadStats]);

  // Nombre de points de regle, pour l'afficher sur la pastille sans charger la liste.
  useEffect(() => {
    if (!currentUser) { setRuleCount(null); return undefined; }
    let go = true;
    (async () => {
      const { count } = await supabase.from("game_rules").select("id", { count: "exact", head: true }).eq("game_id", g.id);
      if (go) setRuleCount(count || 0);
    })();
    return () => { go = false; };
  }, [g.id, currentUser]);

  // Durée moyenne ventilée par nombre de joueurs (calculée à partir des parties).
  const byCount = useMemo(() => {
    if (!sessions || !sessions.length) return [];
    const map = {};
    sessions.forEach((s) => {
      const k = s.player_count || 0;
      if (!map[k]) map[k] = { player_count: k, sum: 0, count: 0 };
      map[k].sum += s.duration_seconds; map[k].count += 1;
    });
    return Object.values(map).map((m) => ({ player_count: m.player_count, avg: Math.round(m.sum / m.count), count: m.count })).sort((a, b) => a.player_count - b.player_count);
  }, [sessions]);

  // Envies de découvrir : qui les a, est-ce que c'est moi ?
  const wantIds = g.wantIds || [];
  const wanters = wantIds.map((id) => users.find((u) => u.id === id)).filter(Boolean);
  const iWant = currentUser && wantIds.includes(currentUser.id);
  const iCanWant = currentUser && myRating === 0; // ça n'a pas de sens d'avoir envie de découvrir un jeu qu'on a déjà noté (donc joué) ; mais on peut vouloir découvrir un jeu qu'on possède sans y avoir encore joué

  // distribution des notes (les demi-notes sont regroupées avec l'entier supérieur : 4,5 → ligne 5)
  const dist = [5, 4, 3, 2, 1].map((n) => ({ n, c: Object.values(g.ratings || {}).filter((v) => Math.ceil(v) === n).length }));

  return (
    <Modal open onClose={onClose} title={g.name} width={620}>
      <div style={{ position: "relative", borderRadius: 16, overflow: "hidden", marginBottom: 18 }}><GameCover g={g} size="lg" />{belt && <div style={{ position: "absolute", bottom: 10, left: 10 }}><ChampionBelt belt={belt} size={58} /></div>}</div>

      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 16 }}>
        {g.year && <Badge color={C.navy}>{g.year}</Badge>}
        {g.min && <Badge color={C.teal}><Users size={12} /> {g.min}{g.max && g.max !== g.min ? `–${g.max}` : ""} joueurs</Badge>}
        {g.time && <Badge color={C.amber}><Clock size={12} /> {g.time} min</Badge>}
        {g.source && g.source !== "manuel" && <Badge color={C.purple}><Globe size={12} /> {g.source}</Badge>}
        {(g.playCount || 0) > 0 && <Badge color="#6e6256">🎲 joué {g.playCount} fois</Badge>}
      </div>

      <a href={ludumLink(g.name, g.ludumUrl)} target="_blank" rel="noopener noreferrer sponsored"
        style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 9, width: "100%", boxSizing: "border-box", background: C.amber, color: "#fff", fontFamily: "'Fredoka',sans-serif", fontWeight: 700, fontSize: 15, padding: "13px 20px", borderRadius: 13, textDecoration: "none", marginBottom: 12 }}>
        <ShoppingBag size={17} /> Acheter chez Ludum
      </a>
      {currentUser && (
        <Btn full variant="teal" style={{ marginBottom: 12 }} onClick={() => { onClose(); openChrono({ gameId: g.id }); }}>
          <Clock size={17} /> Chronométrer une partie
        </Btn>
      )}

      {/* Points de regle : la memoire commune de la table */}
      {currentUser && (
        <button type="button" onClick={() => setShowRules(true)} title="Voir et compléter les points de règle de ce jeu"
          style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", boxSizing: "border-box", background: "rgba(30,138,138,.07)", border: `1.5px solid ${C.teal}33`, borderRadius: 13, padding: "12px 16px", marginBottom: 18, cursor: "pointer", textAlign: "left", font: "inherit" }}
          onMouseEnter={(ev) => { ev.currentTarget.style.background = "rgba(30,138,138,.13)"; }}
          onMouseLeave={(ev) => { ev.currentTarget.style.background = "rgba(30,138,138,.07)"; }}>
          <BookOpen size={21} color={C.teal} style={{ flexShrink: 0 }} />
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: "block", fontFamily: "'Fredoka',sans-serif", fontWeight: 700, color: C.navy, fontSize: 15.5 }}>Points de règle</span>
            <span style={{ display: "block", fontSize: 12.5, color: "#8a7c6a", marginTop: 1 }}>
              {ruleCount === null ? "…" : ruleCount === 0 ? "Aucun pour l'instant — ajoutez le premier" : `${ruleCount} point${ruleCount > 1 ? "s" : ""} noté${ruleCount > 1 ? "s" : ""} par les membres`}
            </span>
          </span>
          {ruleCount > 0 && (
            <span style={{ flexShrink: 0, background: C.teal, color: "#fff", borderRadius: 999, padding: "2px 10px", fontFamily: "'Fredoka',sans-serif", fontWeight: 700, fontSize: 13 }}>{ruleCount}</span>
          )}
          <ChevronRight size={17} color={C.teal} style={{ flexShrink: 0 }} />
        </button>
      )}

      {/* note moyenne */}
      <div style={{ display: "flex", gap: 20, alignItems: "center", background: "rgba(232,163,23,.08)", borderRadius: 16, padding: "16px 20px", marginBottom: 18, flexWrap: "wrap" }}>
        <div style={{ textAlign: "center" }}>
          <button type="button" onClick={() => count > 0 && setShowVoters(true)} style={{ textAlign: "center", background: "none", border: "none", cursor: count > 0 ? "pointer" : "default", padding: 0 }} title={count > 0 ? "Voir qui a voté" : ""}>
            <div style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 700, fontSize: 42, color: C.amber, lineHeight: 1 }}>{count ? avg.toFixed(2).replace(".", ",") : "—"}</div>
            <Stars value={Math.round(avg * 2) / 2} readOnly size={15} />
            <div style={{ fontSize: 12, color: count > 0 ? C.teal : "#9c8d79", marginTop: 3, textDecoration: count > 0 ? "underline" : "none", textUnderlineOffset: 2 }}>{count} avis</div>
          </button>
          <button type="button" onClick={() => setShowScale(true)} title="Comment on note les jeux à l'ALADJ"
            style={{ display: "inline-flex", alignItems: "center", gap: 4, margin: "7px auto 0", background: "none", border: "none", padding: 0, cursor: "pointer", fontFamily: "'Fredoka',sans-serif", fontWeight: 700, fontSize: 12.5, color: C.amber, textDecoration: "underline", textUnderlineOffset: 2, whiteSpace: "nowrap" }}>
            <HelpCircle size={12} /> Notre notation
          </button>
        </div>
        <div style={{ flex: 1, minWidth: 160 }}>
          {dist.map((d) => (
            <div key={d.n} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
              <span style={{ fontSize: 11.5, color: "#8a7c6a", width: 28 }}>{d.n} ★</span>
              <div style={{ flex: 1, height: 7, background: "#eee4d2", borderRadius: 99, overflow: "hidden" }}>
                <div style={{ height: "100%", width: count ? `${(d.c / count) * 100}%` : 0, background: C.amber }} />
              </div>
              <span style={{ fontSize: 11.5, color: "#b6a78f", width: 16, textAlign: "right" }}>{d.c}</span>
            </div>
          ))}
        </div>
      </div>

      {/* durée moyenne des parties chronométrées, par nombre de joueurs */}
      {sessions && sessions.length > 0 && (
        <div style={{ background: "rgba(30,138,138,.08)", borderRadius: 16, padding: "16px 20px", marginBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 12 }}>
            <Clock size={24} color={C.teal} style={{ flexShrink: 0 }} />
            <div style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 700, fontSize: 18, color: C.navy }}>Durée moyenne d'une partie</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr)", gap: 7 }}>
            {byCount.map((b) => (
              <div key={b.player_count} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", fontSize: 14.5 }}>
                <span style={{ color: "#6b5d49" }}>{b.player_count} joueur{b.player_count > 1 ? "s" : ""}</span>
                <span style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 700, color: C.navy }}>{fmtDuration(b.avg)} <span style={{ fontWeight: 400, color: "#9c8d79", fontSize: 12 }}>· {b.count} partie{b.count > 1 ? "s" : ""}</span></span>
              </div>
            ))}
          </div>
          <button onClick={() => setShowSessions(true)} style={{ background: "none", border: "none", color: C.teal, fontSize: 12.5, textDecoration: "underline", textUnderlineOffset: 2, cursor: "pointer", padding: "10px 0 0", fontFamily: "'Nunito',sans-serif" }}>Voir le détail des {sessions.length} partie{sessions.length > 1 ? "s" : ""}</button>
          {(allAvg != null || myAvg != null || setupAvg != null || teardownAvg != null) && (
            <div style={{ borderTop: "1px solid rgba(30,138,138,.18)", marginTop: 12, paddingTop: 11, display: "grid", gridTemplateColumns: "minmax(0,1fr)", gap: 5, fontSize: 13.5 }}>
              {allAvg != null && <div style={{ color: "#6b5d49" }}>Temps de jeu moyen par joueur : <b style={{ color: C.navy }}>{fmtDuration(allAvg)}</b></div>}
              {myAvg != null && <div style={{ color: "#6b5d49" }}>Ton temps de jeu moyen : <b style={{ color: C.teal }}>{fmtDuration(myAvg)}</b></div>}
              {setupAvg != null && <div style={{ color: "#6b5d49" }}>Temps de mise en place moyen : <b style={{ color: C.amber }}>{fmtDuration(setupAvg)}</b></div>}
              {teardownAvg != null && <div style={{ color: "#6b5d49" }}>Temps de rangement moyen : <b style={{ color: C.purple }}>{fmtDuration(teardownAvg)}</b></div>}
            </div>
          )}
        </div>
      )}

      {/* points marqués : moyennes et records */}
      {scoreStats && (
        <div style={{ background: "rgba(107,58,122,.07)", borderRadius: 16, padding: "16px 20px", marginBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 4 }}>
            {scoreStats.dir === "low" ? <TrendingDown size={24} color={C.purple} style={{ flexShrink: 0 }} /> : <TrendingUp size={24} color={C.purple} style={{ flexShrink: 0 }} />}
            <div style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 700, fontSize: 18, color: C.navy }}>Les points</div>
          </div>
          <div style={{ fontSize: 12.5, color: "#9c8d79", marginBottom: 12 }}>
            {SCORE_DIR_LABEL[scoreStats.dir].charAt(0).toUpperCase() + SCORE_DIR_LABEL[scoreStats.dir].slice(1)} · sur {scoreStats.count} score{scoreStats.count > 1 ? "s" : ""} enregistré{scoreStats.count > 1 ? "s" : ""}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr)", gap: 6, fontSize: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
              <span style={{ color: "#6b5d49" }}>Moyenne d'une partie</span>
              <b style={{ fontFamily: "'Fredoka',sans-serif", color: C.navy, whiteSpace: "nowrap" }}>{fmtPts(scoreStats.avg)} pts</b>
            </div>
            {scoreStats.myAvg != null && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
                <span style={{ color: "#6b5d49" }}>Ma moyenne <span style={{ color: "#9c8d79", fontSize: 12.5 }}>({scoreStats.myCount} partie{scoreStats.myCount > 1 ? "s" : ""})</span></span>
                <b style={{ fontFamily: "'Fredoka',sans-serif", color: C.teal, whiteSpace: "nowrap" }}>{fmtPts(scoreStats.myAvg)} pts</b>
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, borderTop: "1px solid rgba(107,58,122,.16)", paddingTop: 7, marginTop: 1 }}>
              <span style={{ color: "#6b5d49" }}>Record <span style={{ color: "#9c8d79", fontSize: 12.5 }}>— {scoreStats.best.name}, {new Date(scoreStats.best.playedAt).toLocaleDateString("fr-FR")}</span></span>
              <b style={{ fontFamily: "'Fredoka',sans-serif", color: C.amber, whiteSpace: "nowrap" }}>{scoreStats.best.score.toLocaleString("fr-FR")} pts</b>
            </div>
            {scoreStats.myBest && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
                <span style={{ color: "#6b5d49" }}>Mon record <span style={{ color: "#9c8d79", fontSize: 12.5 }}>— {new Date(scoreStats.myBest.playedAt).toLocaleDateString("fr-FR")}</span></span>
                <b style={{ fontFamily: "'Fredoka',sans-serif", color: C.teal, whiteSpace: "nowrap" }}>{scoreStats.myBest.score.toLocaleString("fr-FR")} pts</b>
              </div>
            )}
          </div>
        </div>
      )}

      {currentUser && (myGamePlays.length > 0 || belt) && (
        <div style={{ background: "rgba(232,163,23,.08)", borderRadius: 16, padding: "16px 20px", marginBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 10 }}>
            <span style={{ fontSize: 20 }}>🏆</span>
            <div style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 700, fontSize: 18, color: C.navy }}>Mes parties</div>
          </div>
          {myGamePlays.length === 0 ? (
            <div style={{ fontSize: 14, color: "#9c8d79", marginBottom: 4 }}>Tu n'as pas encore de partie enregistrée pour ce jeu.</div>
          ) : (
            <>
              <div style={{ display: "flex", gap: 26, flexWrap: "wrap", alignItems: "baseline" }}>
                <button onClick={() => setHistOpen((v) => !v)} style={{ background: "none", border: "none", cursor: "pointer", textAlign: "left", padding: 0 }}>
                  <div style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 700, fontSize: 24, color: C.navy }}>{myGamePlays.length}</div>
                  <div style={{ fontSize: 12.5, color: C.teal, textDecoration: "underline", textUnderlineOffset: 2 }}>partie{myGamePlays.length > 1 ? "s" : ""} · voir les dates</div>
                </button>
                <div>
                  <div style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 700, fontSize: 24, color: C.amber }}>{winPct}%</div>
                  <div style={{ fontSize: 12.5, color: "#9c8d79" }}>{myWinCount} victoire{myWinCount > 1 ? "s" : ""}</div>
                </div>
              </div>
              {histOpen && (
                <div style={{ borderTop: "1px solid rgba(232,163,23,.2)", marginTop: 12, paddingTop: 10, display: "grid", gridTemplateColumns: "minmax(0,1fr)", gap: 5 }}>
                  {myGamePlays.map((pl) => {
                    const me = pl.participants.find((pt) => pt.userId === currentUser.id);
                    const iWon = !!me && me.isWinner;
                    return (
                      <div key={pl.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10, fontSize: 13.5 }}>
                        <span style={{ color: "#6b5d49" }}>{new Date(pl.playedAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</span>
                        <span style={{ display: "flex", alignItems: "baseline", gap: 8, whiteSpace: "nowrap" }}>
                          {me && me.score != null && <span style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 700, color: C.navy }}>{me.score.toLocaleString("fr-FR")} pts</span>}
                          {iWon && <span style={{ color: C.amber, fontWeight: 700 }}>gagne 🏆</span>}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
          {belt && (
            <div style={{ borderTop: "1px solid rgba(232,163,23,.2)", marginTop: 12, paddingTop: 10, fontSize: 13.5, color: "#6b5d49" }}>
              Tenant du titre : <b style={{ color: C.navy }}>{belt.winners.map((w) => w.name).join(", ")}</b> <span style={{ color: "#9c8d79" }}>({new Date(belt.playedAt).toLocaleDateString("fr-FR")})</span>
            </div>
          )}
        </div>
      )}

      {/* dans le top 10 de… */}
      {(() => {
        const fans = (users || [])
          .map((u) => ({ u, rank: (u.topGames || []).indexOf(g.id) }))
          .filter((x) => x.rank >= 0 && !x.u.banned)
          .sort((a, b) => a.rank - b.rank);
        if (!fans.length) return null;
        return (
          <div style={{ background: "rgba(232,163,23,.09)", border: "1.5px solid #eedbA8", borderRadius: 13, padding: "10px 15px", marginBottom: 18, fontSize: 13.5, color: "#6e6256", lineHeight: 1.55 }}>
            💎 <b style={{ color: C.navy }}>Dans le top 10 de</b> {fans.map((x, i) => (
              <span key={x.u.id}>{i > 0 ? ", " : " "}{x.u.name} <b style={{ color: C.amber }}>(n°{x.rank + 1})</b></span>
            ))}
          </div>
        );
      })()}

      {/* ma note */}
      <div style={{ background: C.paper, border: "2px solid #ece2d0", borderRadius: 16, padding: "14px 18px", marginBottom: 18 }}>
        {currentUser ? (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
            <span style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 700, color: C.navy }}>Votre note {myRating ? `: ${String(myRating).replace(".", ",")}/5` : ""}</span>
            <Stars value={myRating} size={26}
              onRate={async (v) => { await rateGame(g.id, v); setToast(v === myRating ? "Note retirée" : `Noté ${String(v).replace(".", ",")}/5 !`); }}
              onClear={async () => { await clearRating(g.id); setToast("Note effacée"); }} />
          </div>
        ) : (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span style={{ color: "#8a7c6a", fontSize: 14 }}>Connectez-vous pour noter ce jeu.</span>
            <Btn size="sm" onClick={() => { onClose(); onAuth("login"); }}><LogIn size={15} /> Connexion</Btn>
          </div>
        )}
      </div>

      {/* présentation */}
      <h4 style={{ fontFamily: "'Fredoka',sans-serif", color: C.navy, fontSize: 16, margin: "0 0 8px" }}><BookOpen size={16} style={{ verticalAlign: "-2px" }} /> Présentation</h4>
      <p style={{ color: "#5e5346", fontSize: 14.5, lineHeight: 1.6, margin: "0 0 18px", whiteSpace: "pre-line" }}>{desc || "Pas encore de description pour ce jeu."}</p>

      {(g.mechanics || []).length > 0 && (
        <>
          <h4 style={{ fontFamily: "'Fredoka',sans-serif", color: C.navy, fontSize: 16, margin: "0 0 8px" }}>Mécaniques</h4>
          <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 18 }}>
            {g.mechanics.map((m, i) => <Badge key={i} color={C.purple}>{m}</Badge>)}
          </div>
        </>
      )}

      <div style={{ borderTop: "1px solid #f0e8d8", paddingTop: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10 }}>
          <div>
            <span style={{ fontSize: 13, color: "#8a7c6a", display: "block", marginBottom: 4 }}>{unowned ? "Personne ne possède ce jeu" : owners.length > 1 ? "Possédé par" : "Apporté par"}</span>
            {unowned && (
              <div style={{ display: "flex", alignItems: "flex-start", gap: 9, background: "rgba(94,83,70,.08)", border: "1px dashed #c3b49b", borderRadius: 11, padding: "10px 13px", maxWidth: 420 }}>
                <Info size={16} color="#8a7c6a" style={{ flexShrink: 0, marginTop: 2 }} />
                <span style={{ fontSize: 13, color: "#6e6256", lineHeight: 1.55 }}>
                  C'est une <b>fiche de référence</b> : elle n'est pas comptée dans les jeux de l'association, mais elle permet d'<b>enregistrer des parties</b> jouées ailleurs — sur Board Game Arena, en convention, chez des joueurs extérieurs…
                  {currentUser ? " Si vous possédez ce jeu, un clic sur « Je l'ai ! » le fait entrer dans la ludothèque." : ""}
                </span>
              </div>
            )}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {owners.map((o) => (
                <span key={o.id} style={{ display: "inline-flex", alignItems: "center", gap: 5, background: o.id === currentUser?.id ? "rgba(30,138,138,.12)" : "rgba(26,58,92,.05)", borderRadius: 999, padding: "4px 11px", fontSize: 13, fontFamily: "'Fredoka',sans-serif", fontWeight: 600, color: o.id === currentUser?.id ? C.teal : C.navy }}>
                  <span style={{ width: 20, height: 20, borderRadius: 6, background: o.id === currentUser?.id ? C.teal : C.navy, color: "#fff", display: "grid", placeItems: "center", fontSize: 11 }}>{o.name[0].toUpperCase()}</span>
                  {o.name}{o.id === currentUser?.id ? " (vous)" : ""}<DeciderCrownFor id={o.id} size={12} /><ChildPacifierFor id={o.id} size={12} />
                </span>
              ))}
            </div>
          </div>
          {canManage && (
            <div style={{ display: "flex", gap: 8 }}>
              <Btn size="sm" variant="soft" onClick={() => setEditing(true)}><Edit3 size={14} /> Modifier</Btn>
            </div>
          )}
        </div>

        {/* rattachement : je l'ai aussi / je ne l'ai plus */}
        {currentUser && (
          <div style={{ marginTop: 14 }}>
            {isOwner ? (
              <Btn size="sm" variant="danger" onClick={async () => {
                const last = owners.length === 1;
                if (!(await askConfirm({
                  title: "Ne plus posséder ce jeu ?",
                  message: last
                    ? "Vous êtes le dernier propriétaire : la fiche deviendra une « fiche de référence », grisée et hors du compte des jeux de l'association. Vos notes, avis et parties sont conservés, et le jeu reste disponible pour enregistrer des parties."
                    : "Vous serez retiré des propriétaires de ce jeu. La fiche reste dans la ludothèque via les autres propriétaires.",
                  confirmLabel: last ? "Je ne l'ai plus" : "Je ne l'ai plus",
                }))) return;
                await removeOwner(g.id);
                setToast(last ? "Le jeu devient une fiche de référence." : "Vous ne possédez plus ce jeu.");
              }}><X size={14} /> Je ne l'ai plus</Btn>
            ) : (
              <Btn size="sm" variant="teal" onClick={async () => { await addOwner(g.id); setToast(unowned ? "Le jeu rejoint la ludothèque de l'association !" : "Ajouté à votre ludothèque !"); }}>
                <Plus size={14} /> {unowned ? "Je l'ai !" : "Je l'ai aussi"}
              </Btn>
            )}
            {currentUser.admin && (
              <Btn size="sm" variant="soft" style={{ marginLeft: 8 }} onClick={async () => { if (!(await askConfirm({ title: "Supprimer cette fiche ?", message: "La fiche sera supprimée pour tous les membres (propriétaires, notes, envies et commentaires compris). Action définitive.", confirmLabel: "Supprimer" }))) return; await removeGame(g.id); onClose(); setToast("Fiche supprimée (admin)."); }}><Trash2 size={14} /> Supprimer la fiche</Btn>
            )}
          </div>
        )}

        {/* Déclarer qu'un autre membre possède aussi ce jeu (validation de sa part) */}
        {canManage && (
          <div style={{ marginTop: 14 }}>
            {!declaring ? (
              <Btn size="sm" variant="soft" onClick={() => setDeclaring(true)}><UserPlus size={14} /> Déclarer un autre propriétaire</Btn>
            ) : (
              <div style={{ padding: "12px 14px", background: "rgba(232,163,23,.08)", borderRadius: 11 }}>
                <span style={{ display: "block", fontSize: 12.5, color: "#6e6256", marginBottom: 8 }}>Quels membres possèdent aussi ce jeu ? Ils recevront une demande de confirmation.</span>
                {declarableUsers.length === 0 ? (
                  <span style={{ fontSize: 12.5, color: "#9c8d79" }}>Tous les membres sont déjà rattachés à ce jeu.</span>
                ) : (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
                    {declarableUsers.map((u) => {
                      const on = selDeclare.includes(u.id);
                      return (
                        <button key={u.id} type="button" onClick={() => setSelDeclare((arr) => on ? arr.filter((x) => x !== u.id) : [...arr, u.id])}
                          style={{ padding: "6px 12px", borderRadius: 999, cursor: "pointer", fontFamily: "'Fredoka',sans-serif", fontWeight: 600, fontSize: 12.5, border: `2px solid ${on ? C.amber : "#e6dcc9"}`, background: on ? C.amber : "#fff", color: on ? "#fff" : "#8a7c6a" }}>
                          {on && <Check size={12} style={{ verticalAlign: "-1px", marginRight: 3 }} />}{u.name}
                        </button>
                      );
                    })}
                  </div>
                )}
                <div style={{ display: "flex", gap: 8 }}>
                  <Btn size="sm" variant="teal" disabled={selDeclare.length === 0 || declBusy} onClick={async () => {
                    setDeclBusy(true);
                    const res = await declareOwners(g.id, selDeclare);
                    setDeclBusy(false);
                    if (res?.error) { setToast(res.error); }
                    else { setToast("Demande de confirmation envoyée."); setDeclaring(false); setSelDeclare([]); }
                  }}>{declBusy ? <Loader2 size={14} className="aladj-spin" /> : <><Check size={14} /> Envoyer la demande</>}</Btn>
                  <Btn size="sm" variant="soft" onClick={() => { setDeclaring(false); setSelDeclare([]); }}>Annuler</Btn>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Possessions en attente de confirmation (déclarées par d'autres membres) */}
        {pendingOwners.length > 0 && (
          <div style={{ marginTop: 14, padding: "10px 14px", background: "rgba(232,163,23,.08)", borderRadius: 11, border: "1px dashed rgba(232,163,23,.4)" }}>
            <span style={{ fontSize: 12, color: "#9c8d79", fontFamily: "'Fredoka',sans-serif", fontWeight: 600, textTransform: "uppercase", letterSpacing: .5 }}>Possessions à confirmer</span>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 6 }}>
              {pendingOwners.map((o) => (
                <span key={o.id} style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "#fff", borderRadius: 999, padding: "4px 11px", fontSize: 13, color: "#5e5346", border: "1px solid #ece2d0" }}>
                  <span style={{ width: 18, height: 18, borderRadius: 5, background: "#cdbfa8", color: "#fff", display: "grid", placeItems: "center", fontSize: 10 }}>{o.name[0].toUpperCase()}</span>
                  <b>{o.name}</b> selon <i>{o.declaredByName}</i>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Section : envie de découvrir */}
      <div style={{ borderTop: "1px solid #f0e8d8", marginTop: 18, paddingTop: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, flexWrap: "wrap", gap: 10 }}>
          <h4 style={{ fontFamily: "'Fredoka',sans-serif", color: C.navy, fontSize: 16, margin: 0, display: "flex", alignItems: "center", gap: 6 }}>
            <Heart size={16} fill={wantIds.length ? C.red : "none"} color={C.red} /> Envie de découvrir ({wantIds.length})
          </h4>
          {currentUser && iCanWant && (
            iWant
              ? <Btn size="sm" variant="soft" onClick={async () => { await toggleDiscover(g.id); setToast("Envie retirée."); }}><X size={13} /> Je n'ai plus envie</Btn>
              : <Btn size="sm" variant="amber" onClick={async () => { await toggleDiscover(g.id); setToast("Vous avez envie de découvrir ce jeu !"); }}><Heart size={13} /> J'ai envie de le découvrir</Btn>
          )}
        </div>
        {!currentUser && <p style={{ fontSize: 13, color: "#a89a86", margin: "0 0 8px" }}><a href="#" onClick={(e) => { e.preventDefault(); onAuth("login"); }} style={{ color: C.teal }}>Connectez-vous</a> pour ajouter ce jeu à votre envie de découverte.</p>}
        {currentUser && myRating > 0 && <p style={{ fontSize: 12.5, color: "#a89a86", margin: "0 0 8px" }}>Vous avez noté ce jeu, vous l'avez donc joué — votre envie de découverte n'a plus lieu d'être.</p>}
        {wanters.length === 0 ? (
          <p style={{ fontSize: 13, color: "#a89a86", margin: 0 }}>Personne n'a encore exprimé l'envie de le découvrir.</p>
        ) : (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {wanters.map((u) => (
              <span key={u.id} style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "rgba(181,40,58,.08)", color: C.red, borderRadius: 999, padding: "4px 11px", fontSize: 12.5, fontFamily: "'Fredoka',sans-serif", fontWeight: 600 }}>
                <Heart size={11} fill={C.red} color={C.red} /> {u.name}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* section location */}
      <GameRentalSection g={g} onClose={onClose} setToast={setToast} isOwner={isOwner} />

      {/* extensions du jeu */}
      <GameExtensions g={g} onAuth={onAuth} onClose={onClose} setToast={setToast} />

      {/* commentaires sur le jeu */}
      <GameComments g={g} onAuth={onAuth} onClose={onClose} />

      {editing && <EditGameModal g={{ ...g, desc }} onClose={() => setEditing(false)} onSave={async (patch) => { await updateGame(g.id, patch); setEditing(false); setToast("Jeu mis à jour."); }} />}
      {showVoters && <VotersModal g={g} onClose={() => setShowVoters(false)} />}
      {showScale && <RatingScaleModal onClose={() => setShowScale(false)} />}
      {showRules && <GameRulesModal gameId={g.id} gameName={g.name} onClose={() => setShowRules(false)} onCount={setRuleCount} />}
      {showSessions && <SessionsModal sessions={sessions} gameName={g.name} game={g} canDelete={!!currentUser?.admin} onClose={() => setShowSessions(false)} onDeleted={loadStats} />}
    </Modal>
  );
}

/* ---- Modale : liste des membres ayant noté un jeu et leur note ---- */
function VotersModal({ g, onClose }) {
  const { users } = useApp();
  const { avg, count } = gameStats(g);
  const voters = Object.entries(g.ratings || {})
    .map(([uid, val]) => ({ name: (users.find((u) => u.id === uid) || {}).name || "Membre", val }))
    .sort((a, b) => b.val - a.val);
  return (
    <Modal open onClose={onClose} title={`Avis sur ${g.name}`} width={420}>
      <div style={{ textAlign: "center", marginBottom: 16 }}>
        <span style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 700, fontSize: 32, color: C.amber }}>{count ? avg.toFixed(2).replace(".", ",") : "—"}</span>
        <span style={{ fontSize: 14, color: "#9c8d79" }}> / 5 · {count} avis</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr)", gap: 8, maxHeight: "55vh", overflowY: "auto" }}>
        {voters.length === 0 && <span style={{ color: "#a89a86", fontSize: 13.5, textAlign: "center" }}>Personne n'a encore noté ce jeu.</span>}
        {voters.map((v, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "10px 14px", borderRadius: 12, background: "rgba(26,58,92,.04)" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ width: 32, height: 32, borderRadius: 9, background: C.teal, color: "#fff", display: "grid", placeItems: "center", fontFamily: "'Fredoka',sans-serif", fontWeight: 700, fontSize: 14 }}>{v.name[0].toUpperCase()}</span>
              <span style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 600, color: C.navy, fontSize: 14.5 }}>{v.name}</span>
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Stars value={v.val} readOnly size={14} />
              <span style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 700, color: C.amber, fontSize: 14, minWidth: 28, textAlign: "right" }}>{String(v.val).replace(".", ",")}</span>
            </span>
          </div>
        ))}
      </div>
    </Modal>
  );
}

/* ---- Section location d'une fiche de jeu ---- */
function GameRentalSection({ g, onClose, setToast, isOwner }) {
  const { currentUser, myWeights, setGameWeight, loans } = useApp();
  const [showLoan, setShowLoan] = useState(false);
  const [editWeight, setEditWeight] = useState(false);
  const [w, setW] = useState(myWeights[g.id] != null ? String(myWeights[g.id]) : "");
  const price = rentalPrice(g.newPrice);
  const myWeight = myWeights[g.id];
  // ce jeu est-il actuellement prêté par moi ?
  const myActiveLoan = (loans || []).find((l) => l.gameId === g.id && l.lenderId === currentUser?.id && !l.returned);

  return (
    <div style={{ borderTop: "1px solid #f0e8d8", marginTop: 18, paddingTop: 18 }}>
      <h4 style={{ fontFamily: "'Fredoka',sans-serif", color: C.navy, fontSize: 16, margin: "0 0 12px", display: "flex", alignItems: "center", gap: 7 }}>
        <Euro size={17} color={C.teal} /> Location
      </h4>

      {price != null ? (
        <div style={{ background: "rgba(30,138,138,.07)", borderRadius: 12, padding: "12px 14px", marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
          <span style={{ fontSize: 14, color: "#5e5346" }}>Tarif de location <span style={{ fontSize: 12, color: "#9c8d79" }}>(2 semaines)</span></span>
          <span style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 700, color: C.teal, fontSize: 20 }}>{fmtEuro(price)}</span>
        </div>
      ) : (
        <p style={{ fontSize: 13, color: "#9c8d79", margin: "0 0 12px" }}>Le tarif de location s'affichera une fois le prix neuf renseigné (modifiez la fiche).</p>
      )}

      {/* outils du propriétaire : poids + prêter */}
      {isOwner && (
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr)", gap: 10 }}>
          {/* mon poids pour ce jeu (privé) */}
          <div style={{ background: "rgba(26,58,92,.04)", borderRadius: 12, padding: "10px 14px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 13.5, color: "#5e5346", display: "flex", alignItems: "center", gap: 6 }}>
                <Lock size={13} color="#9c8d79" /> Poids de mon exemplaire {myWeight != null ? <b>: {String(myWeight).replace(".", ",")} g</b> : <span style={{ color: "#9c8d79" }}>: non renseigné</span>}
              </span>
              {!editWeight && <button onClick={() => { setW(myWeight != null ? String(myWeight) : ""); setEditWeight(true); }} style={{ background: "none", border: "none", color: C.teal, cursor: "pointer", fontSize: 13, fontFamily: "'Fredoka',sans-serif", fontWeight: 600 }}>Modifier</button>}
            </div>
            {editWeight && (
              <div style={{ display: "flex", gap: 8, marginTop: 8, alignItems: "center" }}>
                <input type="number" step="0.1" value={w} onChange={(e) => setW(e.target.value)} placeholder="ex. 1250,5" style={{ ...inputStyle, flex: 1 }} />
                <span style={{ fontSize: 13, color: "#9c8d79" }}>g</span>
                <Btn size="sm" variant="teal" onClick={async () => { await setGameWeight(g.id, w); setEditWeight(false); setToast("Poids enregistré."); }}>OK</Btn>
                <Btn size="sm" variant="soft" onClick={() => setEditWeight(false)}>Annuler</Btn>
              </div>
            )}
            <p style={{ fontSize: 11.5, color: "#9c8d79", margin: "6px 0 0" }}>Visible de vous seul. Sert à vérifier qu'aucune pièce ne manque au retour (inserts, sleeves... le poids vous est propre).</p>
          </div>

          {/* prêter ce jeu */}
          {myActiveLoan ? (
            <div style={{ background: "rgba(232,163,23,.1)", borderRadius: 12, padding: "10px 14px", fontSize: 13.5, color: "#5e5346" }}>
              Vous prêtez actuellement ce jeu à <b>{myActiveLoan.borrowerName}</b>. Gérez-le dans « Mes locations ».
            </div>
          ) : (
            <Btn variant="teal" onClick={() => setShowLoan(true)}><ArrowRightLeft size={16} /> Prêter ce jeu</Btn>
          )}
        </div>
      )}

      {showLoan && <LoanModal g={g} onClose={() => setShowLoan(false)} setToast={setToast} defaultWeight={myWeight} />}
    </div>
  );
}

/* ---- Modale : enregistrer un prêt ---- */
function LoanModal({ g, onClose, setToast, defaultWeight }) {
  const { users, currentUser, createLoan } = useApp();
  const [borrowerId, setBorrowerId] = useState("");
  const [weight, setWeight] = useState(defaultWeight != null ? String(defaultWeight) : "");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  // date de retour = dans 14 jours
  const due = new Date(); due.setDate(due.getDate() + 14);
  const dueStr = due.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) + " à " + due.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

  const others = users.filter((u) => u.id !== currentUser?.id);

  const submit = async () => {
    setErr("");
    if (!borrowerId) { setErr("Choisissez à qui vous prêtez le jeu."); return; }
    setBusy(true);
    const res = await createLoan(g.id, borrowerId, weight);
    setBusy(false);
    if (res?.error) { setErr(res.error); return; }
    onClose();
    setToast("Prêt enregistré !");
  };

  return (
    <Modal open onClose={onClose} title={`Prêter « ${g.name} »`} width={520}>
      <Field label="À qui prêtez-vous ce jeu ?">
        <select value={borrowerId} onChange={(e) => setBorrowerId(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
          <option value="">— Choisir un membre —</option>
          {others.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>
      </Field>

      <div style={{ background: "rgba(30,138,138,.07)", borderRadius: 12, padding: "12px 14px", marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
        <Calendar size={18} color={C.teal} />
        <span style={{ fontSize: 13.5, color: "#5e5346" }}>Retour prévu le <b>{dueStr}</b> <span style={{ color: "#9c8d79" }}>(dans 2 semaines)</span></span>
      </div>

      <Field label="Poids relevé (g)" hint="Pré-rempli avec votre poids enregistré. Sert à vérifier le jeu au retour (visible de vous seul).">
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input type="number" step="0.1" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="ex. 1250,5" style={{ ...inputStyle, flex: 1 }} />
          <span style={{ fontSize: 14, color: "#9c8d79" }}>g</span>
        </div>
      </Field>

      {err && <div style={{ background: "rgba(181,40,58,.1)", color: C.red, padding: "10px 14px", borderRadius: 11, fontSize: 13.5, fontWeight: 600, marginBottom: 14 }}>{err}</div>}
      <Btn full size="lg" variant="teal" onClick={submit} disabled={busy}>{busy ? <Loader2 size={18} className="aladj-spin" /> : <><ArrowRightLeft size={18} /> Enregistrer le prêt</>}</Btn>
    </Modal>
  );
}

/* ---- Une ligne d'extension : possession + déclaration d'un autre propriétaire (avec confirmation) ---- */
function ExtensionRow({ x, setToast }) {
  const { currentUser, users, addExtensionOwner, removeExtensionOwner, declareExtensionOwners, askConfirm } = useApp();
  const [declaring, setDeclaring] = useState(false);
  const [sel, setSel] = useState([]);
  const [busy, setBusy] = useState(false);
  const isOwner = currentUser && (x.ownerIds || []).includes(currentUser.id);
  const canDeclare = currentUser && (isOwner || currentUser.admin);
  const pending = x.pendingOwners || [];
  const rattaches = new Set([...(x.ownerIds || []), ...pending.map((o) => o.id)]);
  const declarableUsers = (users || []).filter((u) => !u.banned && u.id !== currentUser?.id && !rattaches.has(u.id));

  return (
    <div style={{ background: "rgba(107,58,122,.06)", borderRadius: 12, padding: "10px 12px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 42, height: 42, borderRadius: 9, flexShrink: 0, background: x.img ? `center/cover url("${x.img}")` : `linear-gradient(135deg,${C.purple},${C.red})`, display: "grid", placeItems: "center" }}>
          {!x.img && <span style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 700, color: "#fff", fontSize: 13 }}>🧩</span>}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 600, color: C.navy, fontSize: 14.5 }}>{x.name}</div>
          <div style={{ fontSize: 12, color: "#9c8d79" }}>
            {x.owners && x.owners.length ? `chez ${x.owners.map((o) => o.name).join(", ")}` : "personne ne la possède"}
          </div>
          {pending.length > 0 && (
            <div style={{ fontSize: 11.5, color: "#b98a1e", marginTop: 2, display: "flex", alignItems: "center", gap: 4 }}>
              <Clock size={11} /> En attente : {pending.map((o) => o.name).join(", ")}
            </div>
          )}
        </div>
        {currentUser && (
          isOwner ? (
            <Btn size="sm" variant="danger" onClick={async () => { if (!(await askConfirm({ title: "Ne plus posséder cette extension ?", message: "Vous serez retiré des propriétaires de cette extension.", confirmLabel: "Je ne l'ai plus" }))) return; await removeExtensionOwner(x.id); setToast("Vous ne possédez plus cette extension."); }}><X size={13} /></Btn>
          ) : (
            <Btn size="sm" variant="teal" onClick={async () => { await addExtensionOwner(x.id); setToast("Extension ajoutée à votre ludothèque !"); }}><Plus size={13} /> Je l'ai</Btn>
          )
        )}
      </div>

      {canDeclare && (
        <div style={{ marginTop: 8 }}>
          {!declaring ? (
            <button type="button" onClick={() => setDeclaring(true)}
              style={{ border: "none", background: "transparent", color: C.purple, cursor: "pointer", fontFamily: "'Fredoka',sans-serif", fontWeight: 600, fontSize: 12, padding: 0, display: "inline-flex", alignItems: "center", gap: 4 }}>
              <UserPlus size={13} /> Déclarer un autre propriétaire
            </button>
          ) : (
            <div style={{ padding: "10px 12px", background: "rgba(232,163,23,.08)", borderRadius: 10, marginTop: 4 }}>
              <span style={{ display: "block", fontSize: 12, color: "#6e6256", marginBottom: 8 }}>Quels membres possèdent aussi cette extension ? Ils recevront une demande de confirmation.</span>
              {declarableUsers.length === 0 ? (
                <span style={{ fontSize: 12, color: "#9c8d79" }}>Tous les membres sont déjà rattachés à cette extension.</span>
              ) : (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
                  {declarableUsers.map((u) => {
                    const on = sel.includes(u.id);
                    return (
                      <button key={u.id} type="button" onClick={() => setSel((arr) => on ? arr.filter((v) => v !== u.id) : [...arr, u.id])}
                        style={{ padding: "5px 11px", borderRadius: 999, cursor: "pointer", fontFamily: "'Fredoka',sans-serif", fontWeight: 600, fontSize: 12, border: `2px solid ${on ? C.amber : "#e6dcc9"}`, background: on ? C.amber : "#fff", color: on ? "#fff" : "#8a7c6a" }}>
                        {on && <Check size={11} style={{ verticalAlign: "-1px", marginRight: 3 }} />}{u.name}
                      </button>
                    );
                  })}
                </div>
              )}
              <div style={{ display: "flex", gap: 8 }}>
                <Btn size="sm" variant="teal" disabled={sel.length === 0 || busy} onClick={async () => {
                  setBusy(true);
                  const res = await declareExtensionOwners(x.id, sel);
                  setBusy(false);
                  if (res?.error) { setToast(res.error); }
                  else { setToast("Demande de confirmation envoyée."); setDeclaring(false); setSel([]); }
                }}>{busy ? <Loader2 size={13} className="aladj-spin" /> : <><Check size={13} /> Envoyer</>}</Btn>
                <Btn size="sm" variant="soft" onClick={() => { setDeclaring(false); setSel([]); }}>Annuler</Btn>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ---- Section extensions d'une fiche de jeu ---- */
function GameExtensions({ g, onAuth, onClose, setToast }) {
  const { currentUser, addExtension, addExtensionOwner, removeExtensionOwner } = useApp();
  const [adding, setAdding] = useState(false);
  const [mode, setMode] = useState("bgg"); // "bgg" | "manual"
  const [f, setF] = useState({ name: "", img: "" });
  const [busy, setBusy] = useState(false);
  // recherche BGG
  const [bggQuery, setBggQuery] = useState("");
  const [bggResults, setBggResults] = useState([]);
  const [bggSearching, setBggSearching] = useState(false);
  const [bggLoadingId, setBggLoadingId] = useState(null);
  const [bggErr, setBggErr] = useState("");
  const exts = g.extensions || [];

  const reset = () => { setAdding(false); setMode("bgg"); setF({ name: "", img: "" }); setBggQuery(""); setBggResults([]); setBggErr(""); };

  const submitManual = async () => {
    if (!f.name.trim()) return;
    setBusy(true);
    await addExtension(g.id, f);
    setBusy(false);
    reset();
    setToast("Extension ajoutée !");
  };

  const runBggSearch = async () => {
    if (!bggQuery.trim()) return;
    setBggSearching(true); setBggErr(""); setBggResults([]);
    try {
      const list = await bggSearch(bggQuery.trim());
      setBggResults(list);
      if (list.length === 0) setBggErr("Aucun résultat trouvé sur BoardGameGeek.");
    } catch (e) {
      setBggErr("Recherche BGG indisponible. Essayez la saisie manuelle.");
    } finally { setBggSearching(false); }
  };

  const importFromBgg = async (id, name) => {
    setBggLoadingId(id); setBggErr("");
    try {
      const d = await bggDetails(id);
      // On bascule en mode édition manuel avec les données pré-remplies depuis BGG.
      // L'utilisateur peut alors corriger le nom, l'image, etc. avant validation.
      // Le nom cliqué dans les résultats (souvent français) prime sur le nom
      // "primaire" de BGG (presque toujours anglais).
      setF({ name: name || d.name, img: d.img || "" });
      setMode("manual");
    } catch (e) {
      setBggErr("Impossible de récupérer cette fiche depuis BGG.");
    } finally { setBggLoadingId(null); }
  };

  return (
    <div style={{ borderTop: "1px solid #f0e8d8", marginTop: 18, paddingTop: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <h4 style={{ fontFamily: "'Fredoka',sans-serif", color: C.navy, fontSize: 16, margin: 0 }}>🧩 Extensions ({exts.length})</h4>
        {currentUser && !adding && <Btn size="sm" variant="soft" onClick={() => { setAdding(true); setBggQuery(g.name || ""); }}><Plus size={14} /> Ajouter</Btn>}
      </div>

      {exts.length === 0 && !adding && <span style={{ color: "#a89a86", fontSize: 13.5 }}>Aucune extension référencée pour ce jeu.</span>}

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr)", gap: 10, marginBottom: adding ? 14 : 0 }}>
        {exts.map((x) => <ExtensionRow key={x.id} x={x} setToast={setToast} />)}
      </div>

      {adding && (
        <div style={{ background: "rgba(107,58,122,.06)", borderRadius: 13, padding: 14 }}>
          {/* onglets mode */}
          <div style={{ display: "flex", gap: 6, marginBottom: 14, background: "#fff", borderRadius: 10, padding: 4 }}>
            <button type="button" onClick={() => setMode("bgg")} style={{ flex: 1, padding: "8px 10px", border: "none", borderRadius: 7, background: mode === "bgg" ? C.purple : "transparent", color: mode === "bgg" ? "#fff" : C.navy, cursor: "pointer", fontFamily: "'Fredoka',sans-serif", fontWeight: 600, fontSize: 13.5 }}>Rechercher sur BGG</button>
            <button type="button" onClick={() => setMode("manual")} style={{ flex: 1, padding: "8px 10px", border: "none", borderRadius: 7, background: mode === "manual" ? C.purple : "transparent", color: mode === "manual" ? "#fff" : C.navy, cursor: "pointer", fontFamily: "'Fredoka',sans-serif", fontWeight: 600, fontSize: 13.5 }}>Saisie manuelle</button>
          </div>

          {mode === "bgg" ? (
            <>
              <Field label="Rechercher l'extension sur BoardGameGeek" hint={`Astuce : incluez le nom du jeu de base (ex. « ${g.name} oceania »)`}>
                <div style={{ display: "flex", gap: 8 }}>
                  <TextInput value={bggQuery} onChange={(e) => setBggQuery(e.target.value)} placeholder="Nom de l'extension..." onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); runBggSearch(); } }} autoFocus />
                  <Btn size="md" variant="purple" onClick={runBggSearch} disabled={bggSearching || !bggQuery.trim()}>{bggSearching ? <Loader2 size={15} className="aladj-spin" /> : <Search size={15} />}</Btn>
                </div>
              </Field>
              {bggErr && <div style={{ background: "rgba(181,40,58,.08)", color: C.red, padding: "9px 12px", borderRadius: 9, fontSize: 13, marginBottom: 10 }}>{bggErr}</div>}
              {bggResults.length > 0 && (
                <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr)", gap: 6, maxHeight: 280, overflowY: "auto", marginBottom: 12 }}>
                  {bggResults.map((r) => (
                    <button key={r.id} type="button" onClick={() => importFromBgg(r.id, r.name)} disabled={bggLoadingId === r.id}
                      style={{ display: "flex", alignItems: "center", gap: 10, background: "#fff", border: "1px solid #ece2d0", borderRadius: 10, padding: "9px 12px", cursor: bggLoadingId === r.id ? "wait" : "pointer", textAlign: "left" }}>
                      <span style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ display: "block", fontFamily: "'Fredoka',sans-serif", fontWeight: 600, color: C.navy, fontSize: 13.5 }}>{r.name}</span>
                        {r.year && <span style={{ fontSize: 11.5, color: "#9c8d79" }}>{r.year}</span>}
                      </span>
                      {bggLoadingId === r.id ? <Loader2 size={15} className="aladj-spin" color={C.purple} /> : <Plus size={15} color={C.purple} />}
                    </button>
                  ))}
                </div>
              )}
              <div style={{ display: "flex", gap: 8 }}>
                <Btn size="sm" variant="soft" onClick={reset}>Annuler</Btn>
              </div>
            </>
          ) : (
            <>
              <Field label="Nom de l'extension"><TextInput value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Ex. Oceania, Europe..." autoFocus /></Field>
              <Field label="Image" hint="Facultatif"><ImageField value={f.img} onChange={(v) => setF({ ...f, img: v })} /></Field>
              <div style={{ display: "flex", gap: 8 }}>
                <Btn size="sm" variant="purple" onClick={submitManual} disabled={busy || !f.name.trim()}>{busy ? <Loader2 size={14} className="aladj-spin" /> : <><Plus size={14} /> Ajouter l'extension</>}</Btn>
                <Btn size="sm" variant="soft" onClick={reset}>Annuler</Btn>
              </div>
            </>
          )}
        </div>
      )}

      {!currentUser && exts.length === 0 && <span style={{ fontSize: 13, color: "#a89a86" }}> Connectez-vous pour ajouter une extension.</span>}
    </div>
  );
}

/* ---- Section commentaires d'une fiche de jeu (signés, modifiables) ---- */
/* -----------------------------------------------------------------------------
   REACTIONS AUX COMMENTAIRES
   Quatre reactions, une seule par personne et par commentaire. Recliquer sur la
   meme la retire. Tout le monde voit qui a mis quoi : c'est assume, ce n'est
   pas un vote a bulletin secret.

   Le composant est le meme partout (fiches de jeux, moments jeux, idees, votes) :
   `kind` designe simplement le type de commentaire vise. Les reactions sont
   chargees une fois par liste de commentaires, jamais commentaire par
   commentaire -- sinon une discussion de vingt messages ferait vingt requetes.
   ----------------------------------------------------------------------------- */
const REACTIONS = [
  { key: "heart",  emoji: "❤️", label: "J'adore" },
  { key: "up",     emoji: "👍", label: "D'accord" },
  { key: "down",   emoji: "👎", label: "Pas d'accord" },
  { key: "broken", emoji: "💔", label: "Ça me fend le cœur" },
];

/* Charge les reactions d'un lot de commentaires et expose de quoi les modifier. */
function useReactions(kind, commentIds) {
  const { currentUser } = useApp();
  const [rows, setRows] = useState([]);
  const idsKey = (commentIds || []).slice().sort().join(",");

  const load = useCallback(async () => {
    const ids = idsKey ? idsKey.split(",") : [];
    if (!ids.length) { setRows([]); return; }
    const { data } = await supabase.from("comment_reactions")
      .select("comment_id,user_id,reaction").eq("kind", kind).in("comment_id", ids);
    setRows(data || []);
  }, [kind, idsKey]);
  useEffect(() => { load(); }, [load]);

  const react = useCallback(async (commentId, reaction) => {
    if (!currentUser) return;
    // Mise a jour optimiste : le retour visuel doit etre immediat.
    setRows((rs) => {
      const mine = rs.find((r) => r.comment_id === commentId && r.user_id === currentUser.id);
      const others = rs.filter((r) => !(r.comment_id === commentId && r.user_id === currentUser.id));
      if (mine && mine.reaction === reaction) return others;
      return [...others, { comment_id: commentId, user_id: currentUser.id, reaction }];
    });
    await supabase.rpc("aladj_react", { p_kind: kind, p_comment_id: commentId, p_reaction: reaction });
    await load();
  }, [kind, currentUser, load]);

  return { rows, react };
}

/* Barre de reactions sous un commentaire. */
function CommentReactions({ commentId, rows, onReact, compact }) {
  const { currentUser, users } = useApp();
  const [open, setOpen] = useState(false);
  const mine = rows.find((r) => r.comment_id === commentId && r.user_id === currentUser?.id);
  const here = rows.filter((r) => r.comment_id === commentId);
  const nameOf = (id) => (users || []).find((u) => u.id === id)?.name || "Un membre";
  const total = here.length;

  return (
    <div style={{ marginTop: compact ? 4 : 6 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap" }}>
        {REACTIONS.map((r) => {
          const n = here.filter((x) => x.reaction === r.key).length;
          const on = mine?.reaction === r.key;
          if (!currentUser && n === 0) return null;
          return (
            <button key={r.key} type="button" disabled={!currentUser}
              onClick={() => onReact(commentId, r.key)}
              title={currentUser ? (on ? `Retirer « ${r.label} »` : r.label) : r.label}
              style={{
                display: "inline-flex", alignItems: "center", gap: 3,
                background: on ? "rgba(232,163,23,.16)" : "transparent",
                border: `1px solid ${on ? C.amber : "#e6dcc9"}`, borderRadius: 999,
                padding: n > 0 ? "2px 8px" : "2px 7px", cursor: currentUser ? "pointer" : "default",
                fontSize: 13, lineHeight: 1.4, opacity: !currentUser || n > 0 || on ? 1 : .55,
              }}>
              <span style={{ fontSize: 13 }}>{r.emoji}</span>
              {n > 0 && <span style={{ fontSize: 11.5, fontWeight: 700, color: on ? "#8a6a1f" : "#8a7c6a" }}>{n}</span>}
            </button>
          );
        })}
        {total > 0 && (
          <button type="button" onClick={() => setOpen((v) => !v)}
            title="Voir qui a réagi"
            style={{ background: "none", border: "none", padding: "0 2px", cursor: "pointer", fontSize: 11.5, color: C.teal, textDecoration: "underline", textUnderlineOffset: 2, fontFamily: "'Nunito',sans-serif" }}>
            {open ? "masquer" : `qui ?`}
          </button>
        )}
      </div>
      {open && total > 0 && (
        <div style={{ marginTop: 6, background: "rgba(26,58,92,.04)", borderRadius: 10, padding: "7px 10px", display: "grid", gridTemplateColumns: "minmax(0,1fr)", gap: 3 }}>
          {REACTIONS.map((r) => {
            const who = here.filter((x) => x.reaction === r.key);
            if (!who.length) return null;
            return (
              <div key={r.key} style={{ display: "flex", gap: 7, alignItems: "flex-start", fontSize: 12.5, color: "#5e5346" }}>
                <span style={{ flexShrink: 0 }}>{r.emoji}</span>
                <span style={{ minWidth: 0, overflowWrap: "anywhere" }}>
                  {who.map((x) => (x.user_id === currentUser?.id ? "vous" : nameOf(x.user_id))).join(", ")}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function GameComments({ g, onAuth, onClose }) {
  const { currentUser, addGameComment, updateGameComment, removeGameComment, askConfirm } = useApp();
  const gameReacts = useReactions("game", (g.comments || []).map((c) => c.id));
  const [text, setText] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const [busy, setBusy] = useState(false);
  const list = g.comments || [];

  const submit = async () => {
    if (!text.trim()) return;
    setBusy(true); await addGameComment(g.id, text); setBusy(false); setText("");
  };
  const saveEdit = async () => {
    if (!editText.trim()) return;
    await updateGameComment(editingId, editText); setEditingId(null); setEditText("");
  };

  return (
    <div style={{ borderTop: "1px solid #f0e8d8", marginTop: 18, paddingTop: 18 }}>
      <h4 style={{ fontFamily: "'Fredoka',sans-serif", color: C.navy, fontSize: 16, margin: "0 0 12px" }}>💬 Avis & commentaires ({list.length})</h4>
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr)", gap: 10, marginBottom: 14 }}>
        {list.length === 0 && <span style={{ color: "#a89a86", fontSize: 13.5 }}>Aucun commentaire pour l'instant. Partagez votre avis sur ce jeu !</span>}
        {list.map((c) => {
          const mine = currentUser && c.authorId === currentUser.id;
          const edited = c.updatedAt && c.createdAt && new Date(c.updatedAt).getTime() - new Date(c.createdAt).getTime() > 2000;
          return (
            <div key={c.id} style={{ background: "rgba(26,58,92,.04)", borderRadius: 13, padding: "10px 14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><span style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 700, color: mine ? C.teal : C.navy, fontSize: 13.5 }}>{c.authorName}{mine ? " (vous)" : ""}</span><DeciderCrownFor id={c.authorId} size={13} /><ChildPacifierFor id={c.authorId} size={13} /></span>
                {mine && editingId !== c.id && (
                  <span style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => { setEditingId(c.id); setEditText(c.content); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#9c8d79", padding: 0 }}><Edit3 size={14} /></button>
                    <button onClick={async () => { if (await askConfirm({ title: "Supprimer ce commentaire ?", message: "Votre commentaire sera supprimé définitivement.", confirmLabel: "Supprimer" })) removeGameComment(c.id); }} style={{ background: "none", border: "none", cursor: "pointer", color: C.red, padding: 0 }}><Trash2 size={14} /></button>
                  </span>
                )}
              </div>
              {editingId === c.id ? (
                <div>
                  <textarea value={editText} onChange={(ev) => setEditText(ev.target.value)} rows={2} style={{ ...inputStyle, resize: "vertical", marginBottom: 8 }} />
                  <div style={{ display: "flex", gap: 8 }}>
                    <Btn size="sm" variant="teal" onClick={saveEdit}><Check size={14} /> Enregistrer</Btn>
                    <Btn size="sm" variant="soft" onClick={() => setEditingId(null)}>Annuler</Btn>
                  </div>
                </div>
              ) : (
                <>                <div style={{ fontSize: 14, color: "#5e5346", lineHeight: 1.5, whiteSpace: "pre-line" }}>{c.content}{edited && <span style={{ fontSize: 11, color: "#b6a78f", fontStyle: "italic" }}> (modifié)</span>}</div>
                <CommentReactions commentId={c.id} rows={gameReacts.rows} onReact={gameReacts.react} />
                </>
              )}
            </div>
          );
        })}
      </div>
      {currentUser ? (
        <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
          <textarea value={text} onChange={(ev) => setText(ev.target.value)} rows={1} placeholder="Votre avis sur ce jeu..." style={{ ...inputStyle, resize: "vertical", flex: 1 }} />
          <Btn variant="teal" onClick={submit} disabled={busy || !text.trim()}>{busy ? <Loader2 size={16} className="aladj-spin" /> : "Publier"}</Btn>
        </div>
      ) : (
        <span style={{ fontSize: 13, color: "#a89a86" }}>Connectez-vous pour laisser un commentaire.</span>
      )}
    </div>
  );
}

/* ---- Compte à rebours (se met à jour chaque seconde, passe en négatif) ---- */
function Countdown({ dueAt }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const diff = new Date(dueAt).getTime() - now; // ms restantes (négatif si en retard)
  const late = diff < 0;
  const abs = Math.abs(diff);
  const days = Math.floor(abs / 86400000);
  const hours = Math.floor((abs % 86400000) / 3600000);
  const mins = Math.floor((abs % 3600000) / 60000);
  const secs = Math.floor((abs % 60000) / 1000);
  const parts = days > 0 ? `${days} j ${hours} h ${mins} min` : `${hours} h ${mins} min ${secs} s`;
  return (
    <span style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 700, color: late ? C.red : C.teal, fontSize: 15 }}>
      {late ? `En retard de ${parts}` : `${parts} restant${days > 1 ? "s" : ""}`}
    </span>
  );
}

/* =============================================================================
   PAGE — MES LOCATIONS
   ============================================================================= */
/* ============================================================ */
/* ---- Module "À venir" (jeux à sortir / nouveautés) ---- */
/* ============================================================ */

// Labels et couleurs pour les 5 niveaux du thermomètre
const HYPE_LABELS = {
  1: { label: "Froid", color: "#4a90c2" },
  2: { label: "Tiède", color: "#7ab8a8" },
  3: { label: "Intéressé", color: "#e8a317" },
  4: { label: "Chaud", color: "#e87317" },
  5: { label: "Brûlant", color: "#b5283a" },
};

// Labels pour les 7 intentions d'achat (du plus engagé au moins engagé)
// Le score sert au classement « intention d'achat » : plus l'association est
// proche de l'achat, plus la fiche remonte. Les valeurs sont volontairement
// espacees en haut (10 / 8 / 6) pour qu'un seul acheteur pese davantage que
// plusieurs « peut-etre ».
const INTENT_OPTIONS = [
  { key: "preorder",   label: "Précommandé",               color: "#b5283a", score: 8 },
  { key: "release",    label: "À la sortie",               color: "#e87317", score: 6 },
  { key: "certain",    label: "Certainement",              color: "#e8a317", score: 4 },
  { key: "promo",      label: "En promotion",              color: "#c5a823", score: 3 },
  { key: "completion", label: "Pour compléter une commande", color: "#7ab8a8", score: 2 },
  { key: "unlikely",   label: "Peu probable",              color: "#8e8275", score: 1 },
  { key: "never",      label: "Jamais",                    color: "#6e6256", score: 0 },
];
// Sont « intéressés » tous ceux qui ne se sont pas désistés.
const INTENT_INTERESTED = ["preorder", "release", "certain", "promo", "completion"];
const intentScoreOf = (k) => (INTENT_OPTIONS.find((o) => o.key === k) || {}).score || 0;
// Un jeu déjà possédé vaut le maximum. On ne le déclare pas : on le lit dans
// la ludothèque, où le bouton « Je l'ai ! » l'a déjà inscrit.
const OWNED_SCORE = 10;

/* Somme des intentions d'achat d'une fiche, possesseurs réels compris. */
function intentScore(u) {
  const declared = Object.values(u.intents || {}).reduce((a, k) => a + intentScoreOf(k), 0);
  return declared + OWNED_SCORE * (u.ludoOwners || []).length;
}

/* Etat de sortie d'une fiche, deduit des trois champs (jamais stocke).
   Renvoie { kind, label, color, days } :
     'soon'      une date de sortie est annoncée et pas encore atteinte
     'available' la date est passée, ou « déjà sorti » est coché
     'vo'        pas de sortie VF connue, mais disponible en VO
     'unknown'   on ne sait rien */
function releaseState(u) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const d = u.releaseDate ? new Date(u.releaseDate + "T00:00:00") : null;
  const valid = d && !isNaN(d.getTime());

  if (u.released || (valid && d <= today)) {
    return { kind: "available", label: "Jeu disponible", color: C.teal, days: null, date: valid ? d : null };
  }
  if (valid) {
    const days = Math.ceil((d - today) / 86400000);
    return {
      kind: "soon", color: C.amber, days, date: d,
      label: days === 0 ? "Sortie aujourd'hui" : days === 1 ? "Sortie demain" : days <= 30 ? `Dans ${days} jours` : formatReleaseDate(d),
    };
  }
  if (u.voReleased) {
    return { kind: "vo", label: "Sorti en VO", color: C.purple, days: null, date: null };
  }
  return { kind: "unknown", label: "", color: "#9c8d79", days: null, date: null };
}

/* « 14 mars 2026 », ou « mars 2026 » quand la date est lointaine. */
function formatReleaseDate(d) {
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

/* Ordre d'affichage par defaut : ce qui arrive d'abord (du plus proche au plus
   lointain), puis ce qui est disponible, puis les VO, puis le reste. */
const RELEASE_RANK = { soon: 0, available: 1, vo: 2, unknown: 3 };
function compareByRelease(a, b) {
  const ra = releaseState(a), rb = releaseState(b);
  const dr = RELEASE_RANK[ra.kind] - RELEASE_RANK[rb.kind];
  if (dr !== 0) return dr;
  if (ra.kind === "soon") return ra.days - rb.days;                       // le plus proche d'abord
  if (ra.kind === "available" && ra.date && rb.date) return rb.date - ra.date; // le plus recemment sorti
  return a.name.localeCompare(b.name, "fr");
}

/* Pastille d'etat, utilisee sur la vignette comme sur la fiche. */
function ReleaseBadge({ u, big }) {
  const st = releaseState(u);
  if (st.kind === "unknown") return null;
  return (
    <span title={st.date ? formatReleaseDate(st.date) : st.label}
      style={{
        display: "inline-flex", alignItems: "center", gap: 4, background: st.color, color: "#fff",
        borderRadius: 999, padding: big ? "5px 13px" : "3px 10px",
        fontFamily: "'Fredoka',sans-serif", fontWeight: 700, fontSize: big ? 13.5 : 11.5,
        boxShadow: "0 2px 6px rgba(0,0,0,.18)", whiteSpace: "nowrap",
      }}>
      {st.kind === "available" ? "✓" : st.kind === "vo" ? "🌐" : "📅"} {st.label}
    </span>
  );
}

/* ---- Thermomètre cliquable (1 à 5) ---- */
function Thermometer({ value = 0, onRate, readOnly = false, size = 22 }) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }} onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((n) => {
        const active = shown >= n;
        const cfg = HYPE_LABELS[n];
        return (
          <button key={n} type="button" disabled={readOnly}
            onMouseEnter={() => setHover(n)} onClick={() => !readOnly && onRate && onRate(n)}
            title={`${n} — ${cfg.label}`}
            style={{
              width: size, height: size, borderRadius: "50%", border: "none", padding: 0,
              background: active ? cfg.color : "#e4dccb", cursor: readOnly ? "default" : "pointer",
              transition: "transform .12s", transform: hover === n ? "scale(1.18)" : "scale(1)",
              boxShadow: active ? "0 2px 6px rgba(0,0,0,.15)" : "none",
            }} />
        );
      })}
      {shown > 0 && <span style={{ marginLeft: 6, fontSize: 12, color: HYPE_LABELS[shown].color, fontFamily: "'Fredoka',sans-serif", fontWeight: 700 }}>{HYPE_LABELS[shown].label}</span>}
    </span>
  );
}

// Stats sur une fiche À venir
function upcomingStats(u) {
  const vals = Object.values(u.hypes || {});
  const count = vals.length;
  const avg = count ? vals.reduce((a, b) => a + b, 0) / count : 0;
  return { avg, count };
}

/* ---- Carte d'une fiche À venir (grille principale) ---- */
function UpcomingCard({ u, onOpen, currentUserId }) {
  const { avg, count } = upcomingStats(u);
  const myHype = currentUserId ? (u.hypes?.[currentUserId] || 0) : 0;
  const iVoted = myHype > 0;
  const cfg = HYPE_LABELS[Math.round(avg)] || HYPE_LABELS[1];
  return (
    <button onClick={onOpen} style={{ width: "100%", textAlign: "left", cursor: "pointer", border: "1px solid #ece2d0", borderRadius: 18, overflow: "hidden", padding: 0, background: C.paper, boxShadow: "0 4px 16px rgba(18,41,63,.05)", transition: "transform .15s, box-shadow .2s" }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 12px 30px rgba(18,41,63,.12)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(18,41,63,.05)"; }}>
      <div style={{ position: "relative" }}>
        <GameCover g={u} />
        {count > 0 && (
          <div title={iVoted ? "Hype moyenne — vous avez voté" : "Hype moyenne — vous n'avez pas encore voté"}
            style={{ position: "absolute", top: 10, right: 10, background: iVoted ? cfg.color : "rgba(18,41,63,.85)", color: "#fff", borderRadius: 999, padding: "4px 11px", fontFamily: "'Fredoka',sans-serif", fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", gap: 5 }}>
            🌡️ {avg.toFixed(1).replace(".", ",")}
          </div>
        )}
        <div style={{ position: "absolute", bottom: 10, left: 10 }}><ReleaseBadge u={u} /></div>
      </div>
      <div style={{ padding: 14 }}>
        <h3 style={{ fontFamily: "'Fredoka',sans-serif", color: C.navy, fontSize: 16, margin: "0 0 4px", lineHeight: 1.2 }}>{u.name}</h3>
        {(() => {
          const st = releaseState(u);
          if (st.kind === "soon" && st.date) return <p style={{ fontSize: 12, color: C.amber, fontWeight: 700, margin: "0 0 8px" }}>Sortie le {formatReleaseDate(st.date)}</p>;
          if (st.kind === "available" && st.date) return <p style={{ fontSize: 12, color: "#9c8d79", margin: "0 0 8px" }}>Sorti le {formatReleaseDate(st.date)}</p>;
          return u.year ? <p style={{ fontSize: 12, color: "#9c8d79", margin: "0 0 8px" }}>Sortie : {u.year}</p> : null;
        })()}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", fontSize: 12, color: "#5e5346" }}>
          {u.min && <span>{u.min}{u.max && u.max !== u.min ? `-${u.max}` : ""} j.</span>}
          {u.time && <span>· {u.time} min</span>}
          {u.newPrice != null && <span>· {u.newPrice.toFixed(2).replace(".", ",")} €</span>}
        </div>
        {(() => {
          const owners = (u.ludoOwners || []).length;
          const wanted = Object.values(u.intents || {}).filter((v) => INTENT_INTERESTED.includes(v)).length;
          if (!owners && !wanted && !count) return null;
          return (
            <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginTop: 8, fontSize: 11.5, fontWeight: 700, fontFamily: "'Fredoka',sans-serif" }}>
              {owners > 0 && <span title={`${owners} membre${owners > 1 ? "s l'ont" : " l'a"} déjà`} style={{ color: "#fff", background: C.teal, borderRadius: 999, padding: "2px 9px" }}>📦 {owners} l'{owners > 1 ? "ont" : "a"}</span>}
              {wanted > 0 && <span title={`${wanted} membre${wanted > 1 ? "s intéressés" : " intéressé"} par l'achat`} style={{ color: "#8a6a1f", background: "rgba(232,163,23,.18)", borderRadius: 999, padding: "2px 9px" }}>🎯 {wanted} intéressé{wanted > 1 ? "s" : ""}</span>}
              {count > 0 && <span style={{ color: "#8a7c6a" }}>{count} vote{count > 1 ? "s" : ""} de hype</span>}
            </div>
          );
        })()}
      </div>
    </button>
  );
}

/* ---- Page "À venir" ---- */
function UpcomingPage({ onAuth, setToast }) {
  const { upcoming, users, currentUser } = useApp();
  const [q, setQ] = useState("");
  const [mech, setMech] = useState("");
  // Par defaut on classe par date de sortie : c'est l'information qu'on vient
  // chercher sur cette page. La hype devient un tri parmi d'autres.
  const [sort, setSort] = useState("release");
  const [selected, setSelected] = useState(null);
  const [showAdd, setShowAdd] = useState(false);

  const allMechanics = useMemo(() => {
    const s = new Set();
    upcoming.forEach((u) => (u.mechanics || []).forEach((m) => s.add(m)));
    return [...s].sort((a, b) => a.localeCompare(b, "fr"));
  }, [upcoming]);

  const filtered = useMemo(() => {
    let list = upcoming.filter((u) => {
      const okQ = !q || u.name.toLowerCase().includes(q.toLowerCase());
      const okM = !mech || (u.mechanics || []).includes(mech);
      return okQ && okM;
    }).map((u) => {
      const st = upcomingStats(u);
      return { ...u, _avg: st.avg, _count: st.count };
    });
    if (sort === "release") list.sort(compareByRelease);
    else if (sort === "intent") list.sort((a, b) => intentScore(b) - intentScore(a) || compareByRelease(a, b));
    else if (sort === "hype") list.sort((a, b) => b._avg - a._avg || b._count - a._count || a.name.localeCompare(b.name, "fr"));
    else if (sort === "alpha") list.sort((a, b) => a.name.localeCompare(b.name, "fr"));
    else if (sort === "year") list.sort((a, b) => (Number(b.year) || 0) - (Number(a.year) || 0));
    else if (sort === "recent") list.sort((a, b) => (b.addedAt || 0) - (a.addedAt || 0));
    return list;
  }, [upcoming, q, mech, sort]);

  // Top 20 : toutes les fiches qui ont au moins 1 vote (différence avec ludothèque !)
  const top = useMemo(() => {
    return upcoming
      .map((u) => ({ ...u, _avg: upcomingStats(u).avg, _count: upcomingStats(u).count }))
      .filter((u) => u._count >= 1)
      .sort((a, b) => b._avg - a._avg || b._count - a._count || a.name.localeCompare(b.name, "fr"))
      .slice(0, 20);
  }, [upcoming]);

  return (
    <div style={{ maxWidth: 1280, margin: "0 auto", padding: "32px 24px 60px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16, marginBottom: 26 }}>
        <div>
          <h1 style={{ fontFamily: "'Fredoka',sans-serif", color: C.navy, fontSize: 32, margin: 0 }}>À venir</h1>
          <p style={{ color: "#6e6256", fontSize: 14.5, margin: "6px 0 0", maxWidth: 560 }}>
            Les jeux qui viennent de sortir ou qui arrivent bientôt, classés par <b>date de sortie</b>. <b>Faites grimper votre thermomètre de la hype</b> et indiquez votre intention d'achat — chaque membre voit qui veut quoi, et qui l'a déjà.
          </p>
        </div>
        {currentUser
          ? <Btn variant="amber" size="lg" onClick={() => setShowAdd(true)}><Plus size={18} /> Ajouter un jeu</Btn>
          : <Btn variant="amber" size="lg" onClick={() => onAuth("login")}><LogIn size={18} /> Se connecter</Btn>}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 340px", gap: 28, alignItems: "start" }} className="aladj-ludo-grid">
        <div className="aladj-ludo-main">
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 22 }}>
            <div style={{ flex: 1, minWidth: 200, position: "relative" }}>
              <Search size={18} color="#b6a78f" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
              <TextInput value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher un jeu..." style={{ paddingLeft: 42 }} />
            </div>
            <select value={mech} onChange={(e) => setMech(e.target.value)} style={{ ...inputStyle, width: "auto", cursor: "pointer", fontFamily: "'Fredoka',sans-serif", fontWeight: 600 }}>
              <option value="">Toutes mécaniques</option>
              {allMechanics.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
            <select value={sort} onChange={(e) => setSort(e.target.value)} style={{ ...inputStyle, width: "auto", cursor: "pointer", fontFamily: "'Fredoka',sans-serif", fontWeight: 600 }}>
              <option value="release">Date de sortie</option>
              <option value="intent">Intention d'achat</option>
              <option value="hype">Hype</option>
              <option value="alpha">A → Z</option>
              <option value="year">Année (récent)</option>
              <option value="recent">Récemment ajoutés</option>
            </select>
          </div>

          {filtered.length === 0 ? (
            <EmptyHint icon={Sparkles} text={upcoming.length === 0 ? "Aucun jeu en veille pour l'instant. Ajoutez-en un pour lancer le suivi !" : "Aucun jeu ne correspond aux filtres."} />
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 18 }}>
              {filtered.map((u) => <UpcomingCard key={u.id} u={u} onOpen={() => setSelected(u.id)} currentUserId={currentUser?.id} />)}
            </div>
          )}
        </div>

        <aside style={{ position: "sticky", top: 88, display: "grid", gridTemplateColumns: "minmax(0,1fr)", gap: 18 }} className="aladj-ludo-aside">
          <div style={{ background: `linear-gradient(160deg, ${C.red}, ${C.purple})`, borderRadius: 20, padding: 22, color: "#fff" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <Sparkles size={20} color="#ffd9a3" />
              <h3 style={{ fontFamily: "'Fredoka',sans-serif", fontSize: 18, margin: 0 }}>Top 20 hype</h3>
            </div>
            <p style={{ opacity: .75, fontSize: 12, margin: "0 0 12px", lineHeight: 1.5 }}>Dès qu'un jeu reçoit un vote, il entre dans ce classement.</p>
            {top.length === 0 && <p style={{ opacity: .7, fontSize: 13.5 }}>Pas encore de vote.</p>}
            <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr)", gap: 8, maxHeight: 520, overflowY: "auto", paddingRight: 4 }}>
              {top.map((u, i) => (
                <button key={u.id} onClick={() => setSelected(u.id)} style={{ display: "flex", alignItems: "center", gap: 12, background: "rgba(255,255,255,.09)", border: "none", borderRadius: 12, padding: "9px 12px", cursor: "pointer", textAlign: "left", minWidth: 0 }}>
                  <span style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 700, fontSize: i < 3 ? 17 : 14, color: "rgba(255,255,255,.85)", width: 24, textAlign: "center", flexShrink: 0 }}>{i + 1}</span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: "block", fontFamily: "'Fredoka',sans-serif", fontWeight: 600, fontSize: 14, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.name}</span>
                    <span style={{ fontSize: 11, color: "rgba(255,255,255,.6)" }}>{u._count} vote{u._count > 1 ? "s" : ""}</span>
                  </span>
                  <span style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 700, color: "#ffd9a3" }}>{u._avg.toFixed(1).replace(".", ",")}</span>
                </button>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {showAdd && <AddUpcomingFlow onClose={() => setShowAdd(false)} setToast={setToast} />}
      {selected && <UpcomingDetailModal upcId={selected} onClose={() => setSelected(null)} onAuth={onAuth} setToast={setToast} />}
    </div>
  );
}

/* ---- Flow d'ajout : choix BGG / manuel + détection de doublons ---- */
function AddUpcomingFlow({ onClose, setToast }) {
  const { addUpcoming, upcoming, games } = useApp();
  const [mode, setMode] = useState("choose");
  const [prefillName, setPrefillName] = useState("");

  const handleDone = async (data) => {
    if (!data) { onClose(); return; }
    await addUpcoming({ ...data, source: data.source || "manuel" });
    onClose();
    setToast(`« ${data.name} » ajouté en veille !`);
  };

  return (
    <Modal open onClose={onClose} title="Ajouter un jeu à venir" width={600}>
      {mode === "choose" && (
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr)", gap: 12 }}>
          <p style={{ fontSize: 14, color: "#5e5346", margin: "0 0 6px", lineHeight: 1.55 }}>
            Comment souhaitez-vous ajouter ce jeu à venir ?
          </p>
          <button onClick={() => setMode("bgg")} style={{ display: "flex", alignItems: "center", gap: 14, padding: "18px 20px", border: "2px solid #ece2d0", borderRadius: 14, background: "#fff", cursor: "pointer", textAlign: "left" }}>
            <span style={{ width: 44, height: 44, borderRadius: 11, background: "#ff5100", display: "grid", placeItems: "center" }}><Globe size={22} color="#fff" /></span>
            <span style={{ flex: 1 }}>
              <span style={{ display: "block", fontFamily: "'Fredoka',sans-serif", fontWeight: 700, color: C.navy, fontSize: 15 }}>Rechercher sur BoardGameGeek</span>
              <span style={{ display: "block", fontSize: 12.5, color: "#9c8d79" }}>Fiche pré-remplie (image, mécaniques, joueurs, durée)</span>
            </span>
          </button>
          <button onClick={() => setMode("manual")} style={{ display: "flex", alignItems: "center", gap: 14, padding: "18px 20px", border: "2px solid #ece2d0", borderRadius: 14, background: "#fff", cursor: "pointer", textAlign: "left" }}>
            <span style={{ width: 44, height: 44, borderRadius: 11, background: C.teal, display: "grid", placeItems: "center" }}><Edit3 size={20} color="#fff" /></span>
            <span style={{ flex: 1 }}>
              <span style={{ display: "block", fontFamily: "'Fredoka',sans-serif", fontWeight: 700, color: C.navy, fontSize: 15 }}>Saisie manuelle</span>
              <span style={{ display: "block", fontSize: 12.5, color: "#9c8d79" }}>Pour un jeu non encore référencé sur BGG</span>
            </span>
          </button>
        </div>
      )}
      {mode === "bgg" && <BggImport onBack={() => setMode("choose")} onManual={(name) => { setPrefillName(name); setMode("manual"); }} onDone={async (data) => { if (data) { await handleDone({ ...data, source: "BoardGameGeek" }); } else { onClose(); } }} forUpcoming />}
      {mode === "manual" && <ManualUpcomingForm onBack={() => setMode("choose")} onDone={handleDone} initialName={prefillName} />}
    </Modal>
  );
}

/* ---- Formulaire manuel pour une fiche À venir ---- */
function ManualUpcomingForm({ onBack, onDone, initialName = "" }) {
  const { upcoming, games, currentUser } = useApp();
  const [f, setF] = useState({ name: initialName, year: "", min: "", max: "", time: "", mechanics: [], desc: "", img: "", newPrice: "", ludumUrl: "", releaseDate: "", released: false, voReleased: false });
  const [err, setErr] = useState("");
  const [dismissed, setDismissed] = useState(false);
  const toggleMech = (m) => setF((s) => ({ ...s, mechanics: s.mechanics.includes(m) ? s.mechanics.filter((x) => x !== m) : [...s.mechanics, m] }));

  // Détection de doublons : à la fois dans les fiches À venir ET dans la ludothèque
  const similarUpc = useMemo(() => dismissed ? [] : findSimilarGames(upcoming, f.name), [upcoming, f.name, dismissed]);
  const similarLudo = useMemo(() => dismissed ? [] : findSimilarGames(games, f.name), [games, f.name, dismissed]);
  const [busy, setBusy] = useState(false); // anti double-clic

  const submit = async () => {
    if (busy) return;
    if (!f.name.trim()) { setErr("Le nom du jeu est obligatoire."); return; }
    setBusy(true);
    await onDone({ ...f, name: f.name.trim(), year: Number(f.year) || "", min: Number(f.min) || "", max: Number(f.max) || "", time: Number(f.time) || "", newPrice: f.newPrice,
      releaseDate: f.releaseDate || null, released: !!f.released, voReleased: !!f.voReleased });
  };

  return (
    <div>
      <button onClick={onBack} style={backLinkStyle}><ChevronRight size={15} style={{ transform: "rotate(180deg)" }} /> Retour</button>
      <Field label="Nom du jeu *"><TextInput value={f.name} onChange={(e) => { setF({ ...f, name: e.target.value }); setDismissed(false); }} placeholder="Ex. Nucléum" autoFocus /></Field>

      {(similarUpc.length > 0 || similarLudo.length > 0) && (
        <div style={{ background: "rgba(232,163,23,.08)", border: "1px solid rgba(232,163,23,.3)", borderRadius: 14, padding: 14, marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 700, color: C.amber, fontSize: 14 }}>Ce jeu existe peut-être déjà</span>
            <button onClick={() => setDismissed(true)} style={{ background: "none", border: "none", cursor: "pointer", color: "#9c8d79", fontSize: 12.5 }}>Ignorer</button>
          </div>
          {similarUpc.length > 0 && (
            <div style={{ marginBottom: 8 }}>
              <span style={{ fontSize: 12, color: "#9c8d79", fontWeight: 600, textTransform: "uppercase", letterSpacing: .5 }}>En veille</span>
              {similarUpc.slice(0, 3).map((u) => (
                <div key={u.id} style={{ fontSize: 13.5, color: "#5e5346", padding: "4px 0" }}>• {u.name}{u.year ? ` (${u.year})` : ""}</div>
              ))}
            </div>
          )}
          {similarLudo.length > 0 && (
            <div>
              <span style={{ fontSize: 12, color: "#9c8d79", fontWeight: 600, textTransform: "uppercase", letterSpacing: .5 }}>Dans la ludothèque</span>
              {similarLudo.slice(0, 3).map((g) => (
                <div key={g.id} style={{ fontSize: 13.5, color: "#5e5346", padding: "4px 0" }}>• {g.name}{g.year ? ` (${g.year})` : ""}</div>
              ))}
            </div>
          )}
        </div>
      )}

      <Field label="Image"><ImageField value={f.img} onChange={(v) => setF({ ...f, img: v })} /></Field>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Année de sortie"><TextInput type="number" value={f.year} onChange={(e) => setF({ ...f, year: e.target.value })} placeholder="2026" /></Field>
        <Field label="Prix neuf (€)"><TextInput type="number" step="0.01" value={f.newPrice} onChange={(e) => setF({ ...f, newPrice: e.target.value })} placeholder="50" /></Field>
      </div>
      {/* Sortie : date précise si on la connaît, sinon les deux cases suffisent */}
      <div style={{ background: "rgba(232,163,23,.07)", border: `1px solid ${C.amber}33`, borderRadius: 12, padding: "12px 14px", marginBottom: 14 }}>
        <span style={{ display: "block", fontWeight: 700, fontSize: 13.5, color: C.navy, marginBottom: 8 }}>Disponibilité</span>
        <Field label="Date de sortie en France" hint="Laissez vide si elle n'est pas encore annoncée.">
          <TextInput type="date" value={f.releaseDate} onChange={(e) => setF({ ...f, releaseDate: e.target.value })} />
        </Field>
        <label style={{ display: "flex", alignItems: "flex-start", gap: 9, cursor: "pointer", marginBottom: 7 }}>
          <input type="checkbox" checked={f.released} onChange={(e) => setF({ ...f, released: e.target.checked })} style={{ marginTop: 3, accentColor: C.teal }} />
          <span style={{ fontSize: 13.5, color: "#5e5346", lineHeight: 1.5 }}>
            <b>Déjà sorti</b> — le jeu est disponible en boutique. À cocher quand la date exacte vous échappe : la mention « Jeu disponible » apparaîtra quand même.
          </span>
        </label>
        <label style={{ display: "flex", alignItems: "flex-start", gap: 9, cursor: "pointer" }}>
          <input type="checkbox" checked={f.voReleased} onChange={(e) => setF({ ...f, voReleased: e.target.checked })} style={{ marginTop: 3, accentColor: C.purple }} />
          <span style={{ fontSize: 13.5, color: "#5e5346", lineHeight: 1.5 }}>
            <b>Sorti en VO</b> — disponible à l'étranger, pas encore traduit. Sans date française, la fiche affichera « Sorti en VO ».
          </span>
        </label>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
        <Field label="Joueurs min"><TextInput type="number" value={f.min} onChange={(e) => setF({ ...f, min: e.target.value })} placeholder="2" /></Field>
        <Field label="Joueurs max"><TextInput type="number" value={f.max} onChange={(e) => setF({ ...f, max: e.target.value })} placeholder="4" /></Field>
        <Field label="Durée (min)"><TextInput type="number" value={f.time} onChange={(e) => setF({ ...f, time: e.target.value })} placeholder="60" /></Field>
      </div>
      <Field label="Mécaniques">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {MECHANIC_SUGGESTIONS.map((m) => {
            const active = f.mechanics.includes(m);
            return <button key={m} type="button" onClick={() => toggleMech(m)} style={{ padding: "6px 12px", borderRadius: 999, cursor: "pointer", fontFamily: "'Fredoka',sans-serif", fontWeight: 600, fontSize: 12.5, border: `2px solid ${active ? C.purple : "#e6dcc9"}`, background: active ? C.purple : "#fff", color: active ? "#fff" : "#8a7c6a" }}>{m}</button>;
          })}
        </div>
      </Field>
      <Field label="Description"><textarea value={f.desc} onChange={(e) => setF({ ...f, desc: e.target.value })} rows={4} style={{ ...inputStyle, resize: "vertical" }} placeholder="Présentation du jeu..." /></Field>
      <Field label="Lien Ludum (facultatif)" hint="Collez l'adresse de la fiche du jeu sur Ludum. Laissez vide : un bouton de recherche par nom sera proposé automatiquement.">
        <TextInput value={f.ludumUrl} onChange={(e) => setF({ ...f, ludumUrl: e.target.value })} placeholder="https://www.ludum.fr/..." />
      </Field>

      {err && <div style={{ background: "rgba(181,40,58,.1)", color: C.red, padding: "10px 14px", borderRadius: 11, fontSize: 13.5, fontWeight: 600, marginBottom: 14 }}>{err}</div>}
      <Btn full size="lg" variant="amber" onClick={submit} disabled={busy}>{busy ? <Loader2 size={18} className="aladj-spin" /> : <><Plus size={18} /> Ajouter en veille</>}</Btn>
    </div>
  );
}

/* ---- Fiche détaillée d'un jeu À venir ---- */
function UpcomingDetailModal({ upcId, onClose, onAuth, setToast }) {
  const { upcoming, users, currentUser, setHype, setIntent, removeUpcoming, updateUpcoming, importUpcomingToLudo, addUpcomingComment, updateUpcomingComment, removeUpcomingComment, askConfirm } = useApp();
  const u = upcoming.find((x) => x.id === upcId);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [editId, setEditId] = useState(null);
  const [editText, setEditText] = useState("");
  if (!u) return <Modal open onClose={onClose} title="Fiche introuvable"><p>Cette fiche n'existe plus ou a été retirée (le jeu est probablement passé en ludothèque).</p></Modal>;

  const { avg, count } = upcomingStats(u);
  const myHype = currentUser ? (u.hypes?.[currentUser.id] || 0) : 0;
  const myIntent = currentUser ? u.intents?.[currentUser.id] : null;
  // Détail des votants pour la transparence : qui a mis quel thermomètre, qui veut quoi
  const hypesByMember = Object.entries(u.hypes || {}).map(([uid, v]) => ({ uid, name: users.find((m) => m.id === uid)?.name || "Membre", value: v }));
  const intentsByOption = INTENT_OPTIONS.map((opt) => ({
    ...opt,
    members: Object.entries(u.intents || {}).filter(([, val]) => val === opt.key).map(([uid]) => users.find((m) => m.id === uid)?.name || "Membre"),
  }));

  const submitComment = async () => {
    if (!commentText.trim()) return;
    setBusy(true);
    await addUpcomingComment(u.id, commentText);
    setBusy(false);
    setCommentText("");
  };

  const importMe = async () => {
    setBusy(true);
    const res = await importUpcomingToLudo(u.id);
    setBusy(false);
    if (res?.error) { setToast(res.error); return; }
    setToast("Ajouté à votre ludothèque !");
    onClose();
  };

  return (
    <Modal open onClose={onClose} title={u.name} width={720}>
      {/* en-tête : image + badges */}
      <div style={{ display: "grid", gridTemplateColumns: "180px 1fr", gap: 18, marginBottom: 20 }} className="aladj-upc-head">
        <GameCover g={u} />
        <div>
          <h2 style={{ fontFamily: "'Fredoka',sans-serif", color: C.navy, fontSize: 22, margin: "0 0 8px" }}>{u.name}</h2>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
            {u.year && <Badge color={C.amber}><Calendar size={12} /> {u.year}</Badge>}
            {u.min && <Badge color={C.teal}><Users size={12} /> {u.min}{u.max && u.max !== u.min ? `–${u.max}` : ""} joueurs</Badge>}
            {u.time && <Badge color={C.amber}><Clock size={12} /> {u.time} min</Badge>}
            {u.newPrice != null && <Badge color={C.purple}><Euro size={12} /> {u.newPrice.toFixed(2).replace(".", ",")} €</Badge>}
            <ReleaseBadge u={u} big />
            {u.source && u.source !== "manuel" && <Badge color={C.purple}><Globe size={12} /> {u.source}</Badge>}
          </div>
          {u.mechanics && u.mechanics.length > 0 && (
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 8 }}>
              {u.mechanics.map((m, i) => <Badge key={i} color="#8a7c6a">{m}</Badge>)}
            </div>
          )}
          <p style={{ fontSize: 12.5, color: "#9c8d79", margin: "8px 0 0" }}>Ajouté par {u.createdByName}</p>
        </div>
      </div>

      {u.desc && <p style={{ fontSize: 14.5, color: "#5e5346", lineHeight: 1.6, marginBottom: 18, whiteSpace: "pre-line" }}>{u.desc}</p>}

      <a href={ludumLink(u.name, u.ludumUrl)} target="_blank" rel="noopener noreferrer sponsored"
        style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 9, width: "100%", boxSizing: "border-box", background: C.amber, color: "#fff", fontFamily: "'Fredoka',sans-serif", fontWeight: 700, fontSize: 15, padding: "13px 20px", borderRadius: 13, textDecoration: "none", marginBottom: 18 }}>
        <ShoppingBag size={17} /> Acheter chez Ludum
      </a>

      {/* Prix neuf annoncé (s'il a été renseigné) */}
      {u.newPrice != null && (
        <div style={{ display: "inline-flex", alignItems: "center", gap: 10, background: "rgba(107,58,122,.08)", border: "1px solid rgba(107,58,122,.2)", borderRadius: 12, padding: "10px 16px", marginBottom: 18 }}>
          <Euro size={18} color={C.purple} />
          <span style={{ fontSize: 13, color: "#6e6256" }}>Prix annoncé :</span>
          <span style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 700, color: C.purple, fontSize: 17 }}>{u.newPrice.toFixed(2).replace(".", ",")} €</span>
        </div>
      )}

      {/* Thermomètre de la hype */}
      <div style={{ background: "rgba(232,163,23,.08)", border: "1px solid rgba(232,163,23,.25)", borderRadius: 14, padding: 16, marginBottom: 16 }}>
        <h4 style={{ fontFamily: "'Fredoka',sans-serif", color: C.navy, fontSize: 15, margin: "0 0 6px" }}>🌡️ Thermomètre de la hype</h4>
        <p style={{ fontSize: 12.5, color: "#6e6256", margin: "0 0 12px" }}>De « Froid » (je ne suis pas tenté) à « Brûlant » (j'ai hâte de l'avoir entre les mains).</p>
        {currentUser ? (
          <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", marginBottom: count > 0 ? 12 : 0 }}>
            <Thermometer value={myHype} onRate={(v) => setHype(u.id, v)} size={26} />
            <span style={{ fontSize: 12.5, color: "#9c8d79" }}>{myHype > 0 ? `Votre vote : ${HYPE_LABELS[myHype].label}` : "Cliquez pour voter"}</span>
          </div>
        ) : (
          <Btn size="sm" variant="amber" onClick={() => onAuth("login")}><LogIn size={14} /> Se connecter pour voter</Btn>
        )}
        {count > 0 && (
          <div style={{ borderTop: "1px solid rgba(232,163,23,.2)", paddingTop: 10 }}>
            <div style={{ fontSize: 13, color: "#5e5346", marginBottom: 6 }}>
              <b>Moyenne : {avg.toFixed(2).replace(".", ",")}</b> · {count} vote{count > 1 ? "s" : ""}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {hypesByMember.sort((a, b) => b.value - a.value).map((h) => (
                <span key={h.uid} style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "#fff", borderRadius: 999, padding: "3px 9px", fontSize: 12, color: "#5e5346", border: `1px solid ${HYPE_LABELS[h.value].color}` }}>
                  <span style={{ width: 9, height: 9, borderRadius: "50%", background: HYPE_LABELS[h.value].color }} /> {h.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Intentions d'achat */}
      <div style={{ background: "rgba(107,58,122,.06)", border: "1px solid rgba(107,58,122,.2)", borderRadius: 14, padding: 16, marginBottom: 16 }}>
        <h4 style={{ fontFamily: "'Fredoka',sans-serif", color: C.navy, fontSize: 15, margin: "0 0 10px" }}>🎯 Mon intention d'achat</h4>
        {currentUser ? (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 14 }}>
            {INTENT_OPTIONS.map((opt) => {
              const active = myIntent === opt.key;
              return (
                <button key={opt.key} onClick={() => setIntent(u.id, opt.key)}
                  style={{ padding: "8px 14px", borderRadius: 999, cursor: "pointer", fontFamily: "'Fredoka',sans-serif", fontWeight: 600, fontSize: 13, border: `2px solid ${active ? opt.color : "#e6dcc9"}`, background: active ? opt.color : "#fff", color: active ? "#fff" : "#8a7c6a", transition: "all .12s" }}>
                  {active && <Check size={13} style={{ verticalAlign: "-2px", marginRight: 4 }} />}{opt.label}
                </button>
              );
            })}
          </div>
        ) : (
          <Btn size="sm" variant="purple" onClick={() => onAuth("login")} style={{ marginBottom: 14 }}><LogIn size={14} /> Se connecter</Btn>
        )}
        {/* Coup d'oeil : qui le veut, qui l'a deja */}
        {(() => {
          const nom = (uid) => users.find((m) => m.id === uid)?.name || "Membre";
          const ownerIds = (u.ludoOwners || []).map((o) => o.id);
          const owners = (u.ludoOwners || []).map((o) => o.name);
          // Un propriétaire n'est plus un acheteur potentiel : on l'écarte des
          // intéressés, même s'il avait voté avant de l'acquérir.
          const wanted = Object.entries(u.intents || {})
            .filter(([uid, v]) => INTENT_INTERESTED.includes(v) && !ownerIds.includes(uid))
            .map(([uid]) => nom(uid));
          if (!owners.length && !wanted.length) return null;
          return (
            <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr)", gap: 8, marginBottom: 14 }}>
              {owners.length > 0 && (
                <div style={{ background: "rgba(30,138,138,.1)", border: `1px solid ${C.teal}44`, borderRadius: 11, padding: "9px 12px", fontSize: 13, color: "#5e5346", lineHeight: 1.5 }}>
                  <b style={{ color: C.teal }}>📦 Déjà dans leur ludothèque ({owners.length})</b><br />{owners.join(", ")}
                  <span style={{ display: "block", fontSize: 12, color: "#9c8d79", marginTop: 3 }}>D'après la ludothèque de l'association — rien à déclarer, le bouton « Je l'ai ! » suffit.</span>
                </div>
              )}
              {wanted.length > 0 && (
                <div style={{ background: "rgba(232,163,23,.12)", border: `1px solid ${C.amber}55`, borderRadius: 11, padding: "9px 12px", fontSize: 13, color: "#5e5346", lineHeight: 1.5 }}>
                  <b style={{ color: "#8a6a1f" }}>🎯 Intéressés par l'achat ({wanted.length})</b><br />{wanted.join(", ")}
                  <span style={{ display: "block", fontSize: 12, color: "#9c8d79", marginTop: 3 }}>De quoi grouper une commande, ou savoir à qui l'emprunter.</span>
                </div>
              )}
            </div>
          );
        })()}

        <div style={{ borderTop: "1px solid rgba(107,58,122,.15)", paddingTop: 12 }}>
          <div style={{ fontSize: 13, color: "#5e5346", marginBottom: 8, fontWeight: 600 }}>Intentions des membres</div>
          {intentsByOption.every((o) => o.members.length === 0) && <span style={{ fontSize: 13, color: "#a89a86" }}>Personne ne s'est encore prononcé.</span>}
          {intentsByOption.filter((o) => o.members.length > 0).map((o) => (
            <div key={o.key} style={{ marginBottom: 6, fontSize: 13, color: "#5e5346" }}>
              <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: "50%", background: o.color, marginRight: 8, verticalAlign: "-1px" }} />
              <b>{o.label}</b> ({o.members.length}) : <span style={{ color: "#9c8d79" }}>{o.members.join(", ")}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      {currentUser && (
        <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
          <Btn variant="teal" size="md" onClick={importMe} disabled={busy}><Plus size={16} /> Je l'ai ! L'ajouter à ma ludothèque</Btn>
          <Btn variant="soft" size="md" onClick={() => setEditing(true)}><Edit3 size={15} /> Modifier la fiche</Btn>
          <Btn variant="ghost" size="md" onClick={async () => {
            if (!(await askConfirm({ title: "Supprimer cette fiche ?", message: "La fiche de veille, ses envies et ses commentaires seront supprimés pour tous les membres. Action définitive.", confirmLabel: "Supprimer" }))) return;
            await removeUpcoming(u.id); setToast("Fiche supprimée."); onClose();
          }}><Trash2 size={15} /> Supprimer cette fiche</Btn>
        </div>
      )}

      {/* Commentaires */}
      <div style={{ borderTop: "1px solid #f0e8d8", paddingTop: 16 }}>
        <h4 style={{ fontFamily: "'Fredoka',sans-serif", color: C.navy, fontSize: 15, margin: "0 0 10px" }}>💬 Commentaires ({(u.comments || []).length})</h4>
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr)", gap: 8, marginBottom: 14 }}>
          {(u.comments || []).map((c) => {
            const mine = currentUser && c.authorId === currentUser.id;
            const isEdit = editId === c.id;
            return (
              <div key={c.id} style={{ background: "rgba(26,58,92,.04)", borderRadius: 11, padding: "10px 14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><span style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 600, color: C.navy, fontSize: 13 }}>{c.authorName}</span><DeciderCrownFor id={c.authorId} size={12} /><ChildPacifierFor id={c.authorId} size={12} /></span>
                  {mine && !isEdit && (
                    <span style={{ display: "flex", gap: 5 }}>
                      <button onClick={() => { setEditId(c.id); setEditText(c.content); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#9c8d79" }}><Edit3 size={13} /></button>
                      <button onClick={async () => { if (await askConfirm({ title: "Supprimer ce commentaire ?", message: "Votre commentaire sera supprimé définitivement.", confirmLabel: "Supprimer" })) removeUpcomingComment(c.id); }} style={{ background: "none", border: "none", cursor: "pointer", color: C.red }}><Trash2 size={13} /></button>
                    </span>
                  )}
                </div>
                {isEdit ? (
                  <>
                    <textarea value={editText} onChange={(e) => setEditText(e.target.value)} rows={2} style={{ ...inputStyle, resize: "vertical", marginBottom: 6 }} />
                    <div style={{ display: "flex", gap: 6 }}>
                      <Btn size="sm" variant="teal" onClick={async () => { await updateUpcomingComment(c.id, editText); setEditId(null); }}>Enregistrer</Btn>
                      <Btn size="sm" variant="soft" onClick={() => setEditId(null)}>Annuler</Btn>
                    </div>
                  </>
                ) : (
                  <p style={{ fontSize: 13.5, color: "#5e5346", margin: 0, lineHeight: 1.5, whiteSpace: "pre-line" }}>{c.content}</p>
                )}
              </div>
            );
          })}
        </div>
        {currentUser ? (
          <div style={{ display: "flex", gap: 8 }}>
            <textarea value={commentText} onChange={(e) => setCommentText(e.target.value)} rows={1} placeholder="Écrire un commentaire..." style={{ ...inputStyle, resize: "vertical", flex: 1 }} />
            <Btn variant="teal" onClick={submitComment} disabled={busy || !commentText.trim()}>{busy ? <Loader2 size={16} className="aladj-spin" /> : "Envoyer"}</Btn>
          </div>
        ) : (
          <Btn size="sm" variant="ghost" onClick={() => onAuth("login")}><LogIn size={14} /> Se connecter pour commenter</Btn>
        )}
      </div>

      {editing && <EditUpcomingModal u={u} onClose={() => setEditing(false)} setToast={setToast} />}
    </Modal>
  );
}

/* ---- Modale : modifier une fiche À venir ---- */
function EditUpcomingModal({ u, onClose, setToast }) {
  const { updateUpcoming } = useApp();
  const [f, setF] = useState({
    name: u.name || "", year: u.year || "", min: u.min || "", max: u.max || "", time: u.time || "",
    mechanics: u.mechanics || [], desc: u.desc || "", img: u.img || "", ludumUrl: u.ludumUrl || "",
    newPrice: u.newPrice != null ? String(u.newPrice) : "",
    releaseDate: u.releaseDate || "", released: !!u.released, voReleased: !!u.voReleased,
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const toggleMech = (m) => setF((s) => ({ ...s, mechanics: s.mechanics.includes(m) ? s.mechanics.filter((x) => x !== m) : [...s.mechanics, m] }));

  const save = async () => {
    if (!f.name.trim()) { setErr("Le nom est obligatoire."); return; }
    setBusy(true);
    const res = await updateUpcoming(u.id, {
      name: f.name, year: Number(f.year) || null, min: Number(f.min) || null, max: Number(f.max) || null,
      time: Number(f.time) || null, mechanics: f.mechanics, desc: f.desc, img: f.img, ludumUrl: f.ludumUrl,
      newPrice: f.newPrice === "" ? null : Number(f.newPrice),
      releaseDate: f.releaseDate || null, released: !!f.released, voReleased: !!f.voReleased,
    });
    setBusy(false);
    if (res?.error) { setErr(res.error); return; }
    setToast("Fiche mise à jour.");
    onClose();
  };

  return (
    <Modal open onClose={onClose} title="Modifier la fiche" width={600}>
      <Field label="Nom du jeu *"><TextInput value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} autoFocus /></Field>
      <Field label="Image"><ImageField value={f.img} onChange={(v) => setF({ ...f, img: v })} /></Field>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Année de sortie"><TextInput type="number" value={f.year} onChange={(e) => setF({ ...f, year: e.target.value })} /></Field>
        <Field label="Prix neuf (€)"><TextInput type="number" step="0.01" value={f.newPrice} onChange={(e) => setF({ ...f, newPrice: e.target.value })} /></Field>
      </div>
      {/* Sortie : date précise si on la connaît, sinon les deux cases suffisent */}
      <div style={{ background: "rgba(232,163,23,.07)", border: `1px solid ${C.amber}33`, borderRadius: 12, padding: "12px 14px", marginBottom: 14 }}>
        <span style={{ display: "block", fontWeight: 700, fontSize: 13.5, color: C.navy, marginBottom: 8 }}>Disponibilité</span>
        <Field label="Date de sortie en France" hint="Laissez vide si elle n'est pas encore annoncée.">
          <TextInput type="date" value={f.releaseDate} onChange={(e) => setF({ ...f, releaseDate: e.target.value })} />
        </Field>
        <label style={{ display: "flex", alignItems: "flex-start", gap: 9, cursor: "pointer", marginBottom: 7 }}>
          <input type="checkbox" checked={f.released} onChange={(e) => setF({ ...f, released: e.target.checked })} style={{ marginTop: 3, accentColor: C.teal }} />
          <span style={{ fontSize: 13.5, color: "#5e5346", lineHeight: 1.5 }}>
            <b>Déjà sorti</b> — le jeu est disponible en boutique. À cocher quand la date exacte vous échappe : la mention « Jeu disponible » apparaîtra quand même.
          </span>
        </label>
        <label style={{ display: "flex", alignItems: "flex-start", gap: 9, cursor: "pointer" }}>
          <input type="checkbox" checked={f.voReleased} onChange={(e) => setF({ ...f, voReleased: e.target.checked })} style={{ marginTop: 3, accentColor: C.purple }} />
          <span style={{ fontSize: 13.5, color: "#5e5346", lineHeight: 1.5 }}>
            <b>Sorti en VO</b> — disponible à l'étranger, pas encore traduit. Sans date française, la fiche affichera « Sorti en VO ».
          </span>
        </label>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
        <Field label="Joueurs min"><TextInput type="number" value={f.min} onChange={(e) => setF({ ...f, min: e.target.value })} /></Field>
        <Field label="Joueurs max"><TextInput type="number" value={f.max} onChange={(e) => setF({ ...f, max: e.target.value })} /></Field>
        <Field label="Durée (min)"><TextInput type="number" value={f.time} onChange={(e) => setF({ ...f, time: e.target.value })} /></Field>
      </div>
      <Field label="Mécaniques">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {MECHANIC_SUGGESTIONS.map((m) => {
            const active = f.mechanics.includes(m);
            return <button key={m} type="button" onClick={() => toggleMech(m)} style={{ padding: "6px 12px", borderRadius: 999, cursor: "pointer", fontFamily: "'Fredoka',sans-serif", fontWeight: 600, fontSize: 12.5, border: `2px solid ${active ? C.purple : "#e6dcc9"}`, background: active ? C.purple : "#fff", color: active ? "#fff" : "#8a7c6a" }}>{m}</button>;
          })}
        </div>
      </Field>
      <Field label="Description"><textarea value={f.desc} onChange={(e) => setF({ ...f, desc: e.target.value })} rows={4} style={{ ...inputStyle, resize: "vertical" }} /></Field>
      <Field label="Lien Ludum (facultatif)" hint="Collez l'adresse de la fiche du jeu sur Ludum. Laissez vide : un bouton de recherche par nom sera proposé automatiquement.">
        <TextInput value={f.ludumUrl} onChange={(e) => setF({ ...f, ludumUrl: e.target.value })} placeholder="https://www.ludum.fr/..." />
      </Field>

      {err && <div style={{ background: "rgba(181,40,58,.1)", color: C.red, padding: "10px 14px", borderRadius: 11, fontSize: 13.5, fontWeight: 600, marginBottom: 14 }}>{err}</div>}
      <Btn full size="lg" variant="amber" onClick={save} disabled={busy}>{busy ? <Loader2 size={18} className="aladj-spin" /> : <><Check size={18} /> Enregistrer les modifications</>}</Btn>
    </Modal>
  );
}

function LocationsPage({ setToast }) {
  const { loans, currentUser, closeLoan } = useApp();
  const myLent = (loans || []).filter((l) => l.lenderId === currentUser?.id && !l.returned);
  const myBorrowed = (loans || []).filter((l) => l.borrowerId === currentUser?.id && !l.returned);
  const history = (loans || []).filter((l) => (l.lenderId === currentUser?.id || l.borrowerId === currentUser?.id) && l.returned);

  const fmtDue = (d) => new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) + " à " + new Date(d).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 20px 80px" }}>
      <h1 style={{ fontFamily: "'Fredoka',sans-serif", fontSize: 32, color: C.navy, margin: "0 0 6px" }}>Mes locations</h1>
      <p style={{ color: "#8a7c6a", margin: "0 0 32px", fontSize: 15 }}>Les jeux que vous prêtez et ceux que vous empruntez.</p>

      {/* JEUX QUE JE PRÊTE */}
      <section style={{ marginBottom: 40 }}>
        <h2 style={{ fontFamily: "'Fredoka',sans-serif", fontSize: 20, color: C.navy, margin: "0 0 14px", display: "flex", alignItems: "center", gap: 8 }}>
          <ArrowRightLeft size={20} color={C.teal} /> Jeux que je prête ({myLent.length})
        </h2>
        {myLent.length === 0 ? (
          <EmptyHint icon={Package} text="Vous ne prêtez aucun jeu actuellement." />
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr)", gap: 12 }}>
            {myLent.map((l) => {
              const late = new Date(l.dueAt).getTime() < Date.now();
              return (
                <div key={l.id} style={{ background: C.paper, border: `1px solid ${late ? "rgba(181,40,58,.3)" : "#ece2d0"}`, borderRadius: 16, padding: "16px 18px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <div style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 700, color: C.navy, fontSize: 17 }}>{l.gameName}</div>
                      <div style={{ fontSize: 13.5, color: "#5e5346", marginTop: 4 }}>Prêté à <b>{l.borrowerName}</b></div>
                      <div style={{ fontSize: 13, color: "#9c8d79", marginTop: 2 }}>Retour prévu le {fmtDue(l.dueAt)}</div>
                      {/* poids visible du prêteur seulement */}
                      {l.weight != null && (
                        <div style={{ fontSize: 12.5, color: "#9c8d79", marginTop: 6, display: "inline-flex", alignItems: "center", gap: 5, background: "rgba(26,58,92,.05)", padding: "3px 9px", borderRadius: 8 }}>
                          <Lock size={12} /> Poids relevé : <b>{String(l.weight).replace(".", ",")} g</b>
                        </div>
                      )}
                    </div>
                    <div style={{ textAlign: "right", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 10 }}>
                      <Countdown dueAt={l.dueAt} />
                      <Btn size="sm" variant="teal" onClick={async () => { await closeLoan(l.id); setToast("Location clôturée, jeu rendu !"); }}><Check size={14} /> Le jeu a bien été rendu</Btn>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* JEUX QUE J'EMPRUNTE */}
      <section style={{ marginBottom: 40 }}>
        <h2 style={{ fontFamily: "'Fredoka',sans-serif", fontSize: 20, color: C.navy, margin: "0 0 14px", display: "flex", alignItems: "center", gap: 8 }}>
          <Package size={20} color={C.amber} /> Jeux que j'emprunte ({myBorrowed.length})
        </h2>
        {myBorrowed.length === 0 ? (
          <EmptyHint icon={Package} text="Vous n'empruntez aucun jeu actuellement." />
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr)", gap: 12 }}>
            {myBorrowed.map((l) => {
              const late = new Date(l.dueAt).getTime() < Date.now();
              return (
                <div key={l.id} style={{ background: late ? "rgba(181,40,58,.05)" : C.paper, border: `1px solid ${late ? "rgba(181,40,58,.3)" : "#ece2d0"}`, borderRadius: 16, padding: "16px 18px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <div style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 700, color: C.navy, fontSize: 17 }}>{l.gameName}</div>
                      <div style={{ fontSize: 13.5, color: "#5e5346", marginTop: 4 }}>Emprunté à <b>{l.lenderName}</b></div>
                      <div style={{ fontSize: 13, color: "#9c8d79", marginTop: 2 }}>À rendre le {fmtDue(l.dueAt)}</div>
                      {late && <div style={{ fontSize: 12.5, color: C.red, marginTop: 6, fontWeight: 600 }}>⚠ Pensez à rendre ce jeu à son propriétaire.</div>}
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <Countdown dueAt={l.dueAt} />
                      <div style={{ fontSize: 11.5, color: "#9c8d79", marginTop: 6 }}>Seul {l.lenderName} peut clôturer le prêt.</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* HISTORIQUE */}
      {history.length > 0 && (
        <section>
          <h2 style={{ fontFamily: "'Fredoka',sans-serif", fontSize: 20, color: C.navy, margin: "0 0 14px" }}>Historique ({history.length})</h2>
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr)", gap: 8 }}>
            {history.slice(0, 30).map((l) => (
              <div key={l.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, padding: "10px 14px", background: "rgba(26,58,92,.03)", borderRadius: 10, fontSize: 13.5 }}>
                <span style={{ color: "#5e5346" }}><b>{l.gameName}</b> — {l.lenderId === currentUser?.id ? `prêté à ${l.borrowerName}` : `emprunté à ${l.lenderName}`}</span>
                <span style={{ color: "#9c8d79", fontSize: 12.5 }}>rendu{l.returnedAt ? ` le ${new Date(l.returnedAt).toLocaleDateString("fr-FR")}` : ""}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function EditGameModal({ g, onClose, onSave }) {
  const { currentUser, toggleGameShared } = useApp();
  const [f, setF] = useState({ name: g.name, year: g.year, min: g.min, max: g.max, time: g.time, desc: g.desc, img: g.img, mechanics: (g.mechanics || []).join(", "), newPrice: g.newPrice != null ? String(g.newPrice) : "", ludumUrl: g.ludumUrl || "", scoreDirection: g.scoreDirection || "" });
  const [shared, setShared] = useState(g.shared !== false);
  const isOwner = currentUser && currentUser.id === g.ownerId;
  const previewRental = rentalPrice(Number(f.newPrice));
  return (
    <Modal open onClose={onClose} title="Modifier le jeu" width={560}>
      <Field label="Nom"><TextInput value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
        <Field label="Année"><TextInput type="number" value={f.year} onChange={(e) => setF({ ...f, year: e.target.value })} /></Field>
        <Field label="Min"><TextInput type="number" value={f.min} onChange={(e) => setF({ ...f, min: e.target.value })} /></Field>
        <Field label="Max"><TextInput type="number" value={f.max} onChange={(e) => setF({ ...f, max: e.target.value })} /></Field>
      </div>
      <Field label="Durée (min)"><TextInput type="number" value={f.time} onChange={(e) => setF({ ...f, time: e.target.value })} /></Field>
      <Field label="Prix neuf (€)" hint={previewRental != null ? `Location calculée : ${fmtEuro(previewRental)} (10% arrondi au 0,5 € sup.)` : "Sert à calculer le tarif de location"}>
        <TextInput type="number" step="0.01" value={f.newPrice} onChange={(e) => setF({ ...f, newPrice: e.target.value })} placeholder="ex. 45" />
      </Field>
      <Field label="Mécaniques (séparées par des virgules)"><TextInput value={f.mechanics} onChange={(e) => setF({ ...f, mechanics: e.target.value })} /></Field>
      <ScoreDirectionField value={f.scoreDirection} onChange={(v) => setF({ ...f, scoreDirection: v })} />
      <Field label="Image" hint="Adresse web ou import depuis votre appareil"><ImageField value={f.img} onChange={(v) => setF({ ...f, img: v })} /></Field>
      <Field label="Présentation"><textarea rows={4} value={f.desc} onChange={(e) => setF({ ...f, desc: e.target.value })} style={{ ...inputStyle, resize: "vertical" }} /></Field>
      <Field label="Lien Ludum (facultatif)" hint="Collez l'adresse de la fiche du jeu sur Ludum. Laissez vide : un bouton de recherche par nom sera proposé automatiquement.">
        <TextInput value={f.ludumUrl} onChange={(e) => setF({ ...f, ludumUrl: e.target.value })} placeholder="https://www.ludum.fr/..." />
      </Field>
      {isOwner && (
        <label style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 14px", borderRadius: 12, background: shared ? "rgba(30,138,138,.08)" : "rgba(120,110,95,.08)", marginBottom: 16, cursor: "pointer" }}>
          <input type="checkbox" checked={shared} onChange={(e) => setShared(e.target.checked)} style={{ width: 18, height: 18, accentColor: C.teal }} />
          <span style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 600, color: C.navy, fontSize: 14 }}>
            Partager ce jeu dans la ludothèque commune
            <span style={{ display: "block", fontSize: 12, color: "#8a7c6a", fontWeight: 400 }}>Décochez pour le garder uniquement dans votre ludothèque personnelle.</span>
          </span>
        </label>
      )}
      <Btn full size="lg" onClick={async () => {
        if (isOwner && shared !== (g.shared !== false)) await toggleGameShared(g.id, shared);
        onSave({ ...f, year: Number(f.year) || "", min: Number(f.min) || "", max: Number(f.max) || "", time: Number(f.time) || "", newPrice: f.newPrice === "" ? null : Number(f.newPrice), mechanics: f.mechanics.split(",").map((s) => s.trim()).filter(Boolean) });
      }}><Check size={18} /> Enregistrer</Btn>
    </Modal>
  );
}

/* =============================================================================
   PAGE — LUDOTHÈQUE GÉNÉRALE
   ============================================================================= */
// classement avec départage : note moyenne desc, puis nb votants desc, puis alpha
function rankGames(games, restrictUserIds = null, preferLessPlayed = false) {
  return [...games].map((g) => {
    let ratings = g.ratings || {};
    if (restrictUserIds) {
      ratings = Object.fromEntries(Object.entries(ratings).filter(([uid]) => restrictUserIds.includes(uid)));
    }
    const vals = Object.values(ratings);
    const count = vals.length;
    const avg = count ? vals.reduce((a, b) => a + b, 0) / count : 0;
    return { ...g, _avg: avg, _count: count };
  }).sort((a, b) => {
    if (b._avg !== a._avg) return b._avg - a._avg;
    // option : à note égale, les jeux les moins joués remontent (favorise la rotation)
    if (preferLessPlayed) {
      const pa = a.playCount || 0, pb = b.playCount || 0;
      if (pa !== pb) return pa - pb;
    }
    if (b._count !== a._count) return b._count - a._count;
    return a.name.localeCompare(b.name, "fr");
  });
}

function LudothequePage({ onAuth, setToast, setPage }) {
  const { games, users, currentUser } = useApp();
  const [q, setQ] = useState("");
  const [mech, setMech] = useState("");
  const [players, setPlayers] = useState("");
  const [duration, setDuration] = useState("");
  const [year, setYear] = useState("");
  const [wantFilter, setWantFilter] = useState(""); // "" | "mine" | "any" | "none"
  const [showBoth, setShowBoth] = useState(false); // afficher moyenne + ma note simultanément sur les cartes
  const [sort, setSort] = useState("note");
  const [view, setView] = useState("grid"); // "grid" | "list"
  // Le tri « Mes meilleures notes » compare forcement ma note a celle de l'association :
  // les deux notes sont alors affichees d'office sur les vignettes.
  const bothAuto = !!currentUser && sort === "myNote";
  const [selected, setSelected] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showCustomRank, setShowCustomRank] = useState(false);

  // Jeux réellement visibles dans la ludothèque commune :
  // le propriétaire partage sa ludothèque ET le jeu lui-même est partagé.
  const sharedById = useMemo(() => {
    const m = {};
    users.forEach((u) => { m[u.id] = u.shareLibrary !== false; });
    return m;
  }, [users]);
  const communGames = useMemo(
    () => games.filter((g) => {
      if (g.shared === false) return false;
      // Fiche de référence : elle n'appartient à personne, donc aucun réglage de
      // partage ne s'y applique — elle reste visible de tous.
      if (g.unowned) return true;
      // visible si au moins un propriétaire partage sa ludothèque
      return (g.ownerIds || []).some((id) => sharedById[id] !== false);
    }),
    [games, sharedById]
  );

  const allMechanics = useMemo(() => {
    const s = new Set();
    communGames.forEach((g) => (g.mechanics || []).forEach((m) => s.add(m)));
    return [...s].sort((a, b) => a.localeCompare(b, "fr"));
  }, [communGames]);

  // Années présentes dans la ludothèque, du plus récent au plus ancien
  // + flag indiquant s'il y a des jeux sans année renseignée (pour proposer le filtre "sans année")
  const { allYears, hasNoYear } = useMemo(() => {
    const s = new Set();
    let none = false;
    communGames.forEach((g) => {
      const y = Number(g.year) || 0;
      if (y > 0) s.add(y);
      else none = true;
    });
    return { allYears: [...s].sort((a, b) => b - a), hasNoYear: none };
  }, [communGames]);

  // Rendu progressif : on affiche les jeux par tranches pour rester fluide
  // quand la ludothèque grossit (des milliers de cartes tuent les téléphones).
  const [visibleCount, setVisibleCount] = useState(60);
  // "" = tout ; "owned" = jeux de l'asso seulement ; "ref" = fiches de reference seulement
  const [ownFilter, setOwnFilter] = useState("");
  const filtered = useMemo(() => {
    let list = communGames.filter((g) => {
      // filtre possession : jeux de l'association / fiches de reference
      if (ownFilter === "owned" && g.unowned) return false;
      if (ownFilter === "ref" && !g.unowned) return false;
      const okQ = !q || g.name.toLowerCase().includes(q.toLowerCase()) || (g.ownerName || "").toLowerCase().includes(q.toLowerCase());
      const okM = !mech || (g.mechanics || []).includes(mech);
      // filtre nombre de joueurs : le jeu accepte-t-il ce nombre ? (entre min et max)
      let okP = true;
      if (players) {
        const want = Number(players);
        const min = Number(g.min) || 1;
        const max = g.max ? Number(g.max) : Infinity;
        okP = (players === "7") ? max >= 7 : (want >= min && want <= max);
      }
      // filtre durée : durée du jeu sous le seuil choisi
      let okD = true;
      if (duration) {
        const t = Number(g.time) || 0;
        if (duration === "121") okD = t > 120;
        else okD = t > 0 && t <= Number(duration);
      }
      // filtre année : "none" = sans année renseignée ; sinon année précise
      let okY = true;
      if (year) {
        const y = Number(g.year) || 0;
        if (year === "none") okY = !g.year || y === 0;
        else okY = y === Number(year);
      }
      // filtre envies : "mine" = je veux le découvrir ; "any" = au moins un membre ; "none" = personne
      let okW = true;
      if (wantFilter) {
        const wantIds = g.wantIds || [];
        if (wantFilter === "mine") okW = currentUser && wantIds.includes(currentUser.id);
        else if (wantFilter === "any") okW = wantIds.length > 0;
        else if (wantFilter === "none") okW = wantIds.length === 0;
      }
      return okQ && okM && okP && okD && okY && okW;
    });
    if (sort === "note") list = rankGames(list);
    else if (sort === "myNote") list = [...list].sort((a, b) => (b.ratings?.[currentUser?.id] || 0) - (a.ratings?.[currentUser?.id] || 0));
    else if (sort === "alpha") list = [...list].sort((a, b) => a.name.localeCompare(b.name, "fr"));
    else if (sort === "recent") list = [...list].sort((a, b) => (b.addedAt || 0) - (a.addedAt || 0));
    else if (sort === "wants") list = [...list].sort((a, b) => (b.wantIds?.length || 0) - (a.wantIds?.length || 0));
    return list;
  }, [communGames, q, mech, players, duration, year, wantFilter, ownFilter, sort, currentUser]);

  // Jeux réellement possédés par des membres : c'est eux, et eux seuls, qui
  // constituent « la ludothèque de l'association ». Les fiches de référence
  // restent visibles et consultables, mais ne sont pas comptées.
  const ownedCount = useMemo(() => games.filter((g) => !g.unowned).length, [games]);
  const refCount = games.length - ownedCount;

  // Top 20 : un jeu doit avoir au moins 4 votes pour entrer dans le classement
  // (évite que quelques avis isolés propulsent un jeu en tête).
  const top = useMemo(() => rankGames(communGames).filter((g) => g._count >= 4).slice(0, 20), [communGames]);
  const selectedGame = games.find((g) => g.id === selected);

  return (
    <div style={{ maxWidth: 1180, margin: "0 auto", padding: "40px 24px 80px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 14, marginBottom: 26 }}>
        <div>
          <span style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 700, color: C.teal, fontSize: 13, textTransform: "uppercase", letterSpacing: "0.12em" }}>La collection de l'asso</span>
          <h1 style={{ fontFamily: "'Fredoka',sans-serif", color: C.navy, fontSize: "clamp(30px,5vw,44px)", margin: "4px 0 0", letterSpacing: "-0.02em" }}>Ludothèque · {ownedCount} jeux</h1>
          {refCount > 0 && (
            <span style={{ display: "block", fontSize: 13, color: "#9c8d79", marginTop: 5 }}>
              + {refCount} fiche{refCount > 1 ? "s" : ""} de référence <span style={{ color: "#b6a78f" }}>· jeux que personne ne possède, gardés pour enregistrer des parties</span>
            </span>
          )}
        </div>
        {currentUser
          ? <Btn variant="amber" size="lg" onClick={() => setShowAdd(true)}><Plus size={18} /> Ajouter un jeu</Btn>
          : <Btn variant="ghost" onClick={() => onAuth("login")}><LogIn size={16} /> Connectez-vous pour ajouter</Btn>}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 340px", gap: 28, alignItems: "start" }} className="aladj-ludo-grid">
        {/* COLONNE PRINCIPALE */}
        <div className="aladj-ludo-main">
          <RatingScaleNote />
          {/* recherche + filtres */}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 22 }}>
            <div style={{ flex: 1, minWidth: 200, position: "relative" }}>
              <Search size={18} color="#b6a78f" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
              <TextInput value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher un jeu, un propriétaire..." style={{ paddingLeft: 42 }} />
            </div>
            <select value={mech} onChange={(e) => setMech(e.target.value)} style={{ ...inputStyle, width: "auto", cursor: "pointer", fontFamily: "'Fredoka',sans-serif", fontWeight: 600 }}>
              <option value="">Toutes mécaniques</option>
              {allMechanics.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
            <select value={players} onChange={(e) => setPlayers(e.target.value)} style={{ ...inputStyle, width: "auto", cursor: "pointer", fontFamily: "'Fredoka',sans-serif", fontWeight: 600 }}>
              <option value="">Tous joueurs</option>
              <option value="1">1 joueur</option>
              <option value="2">2 joueurs</option>
              <option value="3">3 joueurs</option>
              <option value="4">4 joueurs</option>
              <option value="5">5 joueurs</option>
              <option value="6">6 joueurs</option>
              <option value="7">7+ joueurs</option>
            </select>
            <select value={duration} onChange={(e) => setDuration(e.target.value)} style={{ ...inputStyle, width: "auto", cursor: "pointer", fontFamily: "'Fredoka',sans-serif", fontWeight: 600 }}>
              <option value="">Toutes durées</option>
              <option value="30">≤ 30 min</option>
              <option value="45">≤ 45 min</option>
              <option value="60">≤ 1 h</option>
              <option value="90">≤ 1 h 30</option>
              <option value="120">≤ 2 h</option>
              <option value="121">{"> 2 h"}</option>
            </select>
            <select value={year} onChange={(e) => setYear(e.target.value)} style={{ ...inputStyle, width: "auto", cursor: "pointer", fontFamily: "'Fredoka',sans-serif", fontWeight: 600 }}>
              <option value="">Toutes années</option>
              {allYears.map((y) => <option key={y} value={String(y)}>{y}</option>)}
              {hasNoYear && <option value="none">Sans année renseignée</option>}
            </select>
            <select value={wantFilter} onChange={(e) => setWantFilter(e.target.value)} style={{ ...inputStyle, width: "auto", cursor: "pointer", fontFamily: "'Fredoka',sans-serif", fontWeight: 600 }}>
              <option value="">Toutes envies ❤</option>
              {currentUser && <option value="mine">Que j'ai envie de découvrir</option>}
              <option value="any">Avec au moins une envie</option>
              <option value="none">Sans envie</option>
            </select>
            <select value={ownFilter} onChange={(e) => setOwnFilter(e.target.value)} title="Filtrer sur les jeux réellement possédés, ou sur les fiches de référence" style={{ ...inputStyle, width: "auto", cursor: "pointer", fontFamily: "'Fredoka',sans-serif", fontWeight: 600 }}>
              <option value="">Toute la ludothèque</option>
              <option value="owned">Jeux de l'association</option>
              <option value="ref">Fiches de référence</option>
            </select>
            <select value={sort} onChange={(e) => setSort(e.target.value)} style={{ ...inputStyle, width: "auto", cursor: "pointer", fontFamily: "'Fredoka',sans-serif", fontWeight: 600 }}>
              <option value="note">Mieux notés (général)</option>
              <option value="myNote">Mes meilleures notes</option>
              <option value="wants">Plus d'envies ❤</option>
              <option value="alpha">A → Z</option>
              <option value="recent">Récents</option>
            </select>
            <button onClick={() => setView((v) => v === "grid" ? "list" : "grid")} title={view === "grid" ? "Afficher en liste" : "Afficher en grille"}
              style={{ ...inputStyle, width: "auto", cursor: "pointer", fontFamily: "'Fredoka',sans-serif", fontWeight: 600, display: "flex", alignItems: "center", gap: 6, color: C.navy }}>
              {view === "grid" ? <><Menu size={16} /> Liste</> : <><Library size={16} /> Grille</>}
            </button>
            {currentUser && view === "grid" && (
              <label style={{ display: "flex", alignItems: "center", gap: 7, cursor: bothAuto ? "default" : "pointer", fontFamily: "'Fredoka',sans-serif", fontWeight: 600, fontSize: 13.5, color: bothAuto ? "#9c8d79" : C.navy, padding: "0 4px" }}
                title={bothAuto ? "Le tri « Mes meilleures notes » affiche toujours les deux notes" : "Afficher la note moyenne et votre note en même temps"}>
                <input type="checkbox" checked={showBoth || bothAuto} disabled={bothAuto} onChange={(e) => setShowBoth(e.target.checked)} style={{ width: 16, height: 16, accentColor: C.teal, cursor: bothAuto ? "default" : "pointer" }} />
                Voir les 2 notes
              </label>
            )}
          </div>

          {filtered.length === 0 ? (
            <EmptyHint icon={Library} text="Aucun jeu ne correspond." />
          ) : view === "list" ? (
            <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr)", gap: 4 }}>
              {/* en-tête de liste */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0, padding: "6px 14px", fontSize: 12, color: "#9c8d79", fontFamily: "'Fredoka',sans-serif", fontWeight: 600 }}>
                <span style={{ flex: 1, minWidth: 0 }}>Jeu</span>
                <span style={{ width: 60, flexShrink: 0, textAlign: "center" }} title="Membres qui veulent découvrir ce jeu">Envies</span>
                <span style={{ width: 70, flexShrink: 0, textAlign: "center" }}>Moyenne</span>
                <span style={{ width: 70, flexShrink: 0, textAlign: "center" }}>Ma note</span>
              </div>
              {filtered.slice(0, visibleCount).map((g) => {
                const { avg, count } = gameStats(g);
                const myR = currentUser ? (g.ratings?.[currentUser.id] || 0) : 0;
                const wantC = (g.wantIds || []).length;
                return (
                  <button key={g.id} onClick={() => setSelected(g.id)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 10, border: "1px solid #efe6d6", background: "#fff", cursor: "pointer", textAlign: "left", minWidth: 0 }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "rgba(30,138,138,.05)"} onMouseLeave={(e) => e.currentTarget.style.background = "#fff"}>
                    <span style={{ flex: 1, minWidth: 0, fontFamily: "'Fredoka',sans-serif", fontWeight: 600, color: C.navy, fontSize: 14.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{g.name}</span>
                    <span style={{ width: 60, flexShrink: 0, textAlign: "center", fontFamily: "'Fredoka',sans-serif", fontWeight: 700, fontSize: 13.5, color: wantC ? C.red : "#cdbfa8", display: "inline-flex", alignItems: "center", gap: 4, justifyContent: "center" }}>
                      {wantC > 0 && <Heart size={12} fill={C.red} color={C.red} />}{wantC || "—"}
                    </span>
                    <span style={{ width: 70, flexShrink: 0, textAlign: "center", fontFamily: "'Fredoka',sans-serif", fontWeight: 700, color: count ? C.amber : "#cdbfa8", fontSize: 14 }}>{count ? avg.toFixed(2).replace(".", ",") : "—"}</span>
                    <span style={{ width: 70, flexShrink: 0, textAlign: "center", fontFamily: "'Fredoka',sans-serif", fontWeight: 700, color: myR ? C.teal : "#cdbfa8", fontSize: 14 }}>{myR ? String(myR).replace(".", ",") : "—"}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 18 }}>
              {filtered.slice(0, visibleCount).map((g) => <GameCard key={g.id} g={g} onOpen={() => setSelected(g.id)} showBoth={showBoth || bothAuto} />)}
            </div>
          )}
          {filtered.length > visibleCount && (
            <div style={{ textAlign: "center", marginTop: 20 }}>
              <Btn variant="soft" onClick={() => setVisibleCount((c) => c + 60)}>
                Afficher plus de jeux ({filtered.length - visibleCount} restant{filtered.length - visibleCount > 1 ? "s" : ""})
              </Btn>
            </div>
          )}
        </div>

        {/* COLONNE LATÉRALE : classements */}
        <aside style={{ position: "sticky", top: 88, display: "grid", gridTemplateColumns: "minmax(0,1fr)", gap: 18 }} className="aladj-ludo-aside">
          {/* CLASSEMENT PERSONNALISÉ (placé en premier pour remonter en haut sur mobile) */}
          <div style={{ background: C.paper, borderRadius: 20, padding: 22, border: `2px solid ${C.teal}` }} className="aladj-ludo-custom">
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <Award size={20} color={C.teal} />
              <h3 style={{ fontFamily: "'Fredoka',sans-serif", fontSize: 18, margin: 0, color: C.navy }}>Classement sur-mesure</h3>
            </div>
            <p style={{ fontSize: 13.5, color: "#6e6256", lineHeight: 1.5, margin: "0 0 14px" }}>
              Choisissez les membres présents à votre moment jeux pour trouver le jeu qui plaira au plus grand nombre.
            </p>
            <Btn full variant="teal" onClick={() => setShowCustomRank(true)}><Filter size={16} /> Composer ma tablée</Btn>
          </div>

          {/* TOP 20 */}
          <div style={{ background: `linear-gradient(160deg, ${C.navy}, ${C.navyDeep})`, borderRadius: 20, padding: 22, color: "#fff" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <Trophy size={20} color={C.amber} />
              <h3 style={{ fontFamily: "'Fredoka',sans-serif", fontSize: 19, margin: 0 }}>Top 20 de l'asso</h3>
            </div>
            {top.length === 0 && <p style={{ opacity: .7, fontSize: 13.5, lineHeight: 1.5 }}>Pas encore de jeu avec au moins 4 votes. Notez des jeux pour faire vivre le classement !</p>}
            <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr)", gap: 8, maxHeight: 520, overflowY: "auto", paddingRight: 4 }}>
              {top.map((g, i) => {
                const medal = i === 0 ? C.amber : i === 1 ? "#d9d9d9" : i === 2 ? "#cd9b6a" : "rgba(255,255,255,.5)";
                return (
                  <button key={g.id} onClick={() => setSelected(g.id)} style={{ display: "flex", alignItems: "center", gap: 12, background: "rgba(255,255,255,.07)", border: "none", borderRadius: 12, padding: "9px 12px", cursor: "pointer", textAlign: "left", minWidth: 0 }}>
                    <span style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 700, fontSize: i < 3 ? 18 : 15, color: medal, width: 24, textAlign: "center", flexShrink: 0 }}>{i + 1}</span>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: "block", fontFamily: "'Fredoka',sans-serif", fontWeight: 600, fontSize: 14.5, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{g.name}</span>
                      <span style={{ fontSize: 11.5, color: "rgba(255,255,255,.55)" }}>{g._count} vote{g._count > 1 ? "s" : ""}</span>
                    </span>
                    <span style={{ display: "flex", alignItems: "center", gap: 4, color: C.amber, fontFamily: "'Fredoka',sans-serif", fontWeight: 700 }}>
                      <Star size={14} fill={C.amber} /> {g._avg.toFixed(2).replace(".", ",")}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </aside>
      </div>

      {/* Mention obligatoire BGG (données importées via leur API) */}
      <div style={{ textAlign: "center", padding: "30px 20px 10px", marginTop: 10 }}>
        <a href="https://boardgamegeek.com" target="_blank" rel="noopener noreferrer"
          style={{ display: "inline-flex", alignItems: "center", gap: 8, textDecoration: "none", color: "#9c8d79", fontSize: 12.5, opacity: .85 }}>
          <span style={{ display: "inline-grid", placeItems: "center", width: 22, height: 22, borderRadius: 6, background: "#ff5100" }}>
            <Dice color="#fff" n={5} style={{ width: 13 }} />
          </span>
          <span>Certaines données de jeux proviennent de <b style={{ color: "#6e6256" }}>BoardGameGeek</b> — Powered by BGG</span>
        </a>
      </div>

      {showAdd && <AddGameFlow onClose={() => setShowAdd(false)} setToast={setToast} />}
      {selectedGame && <GameDetailModal g={selectedGame} onClose={() => setSelected(null)} onAuth={onAuth} setToast={setToast} />}
      {showCustomRank && <CustomRankModal onClose={() => setShowCustomRank(false)} onOpenGame={(id) => { setShowCustomRank(false); setSelected(id); }} />}
    </div>
  );
}

/* ---- Classement personnalisé par membres ---- */
function CustomRankModal({ onClose, onOpenGame }) {
  const { users, games } = useApp();
  const [chosen, setChosen] = useState([]);
  const [players, setPlayers] = useState(""); // "" = automatique (taille de la tablée)
  const [duration, setDuration] = useState(""); // "" = toutes ; "lo-hi" = bornes en minutes ; "181" = 3 h et plus
  const [mechFilter, setMechFilter] = useState([]); // mécaniques sélectionnées (multi)
  // Jeux pour enfants : "exclude" = masqués | "include" = enfants + tous les autres | "only" = uniquement enfants
  const [kidsMode, setKidsMode] = useState("exclude");
  // Jeux « one shot » (enquête, escape game, legacy) : masqués par défaut
  const [showOneShot, setShowOneShot] = useState(false);
  const STEP = 15; // nombre de jeux ajoutés à chaque clic sur « Afficher plus »
  const [limits, setLimits] = useState({ discover: STEP, regular: STEP, explore: STEP });
  const toggle = (id) => setChosen((c) => c.includes(id) ? c.filter((x) => x !== id) : [...c, id]);
  const toggleMech = (m) => setMechFilter((c) => c.includes(m) ? c.filter((x) => x !== m) : [...c, m]);

  // Liste des mécaniques présentes dans la ludothèque (pour le filtre)
  const allMechanics = useMemo(() => {
    const s = new Set();
    games.forEach((g) => (g.mechanics || []).forEach((m) => s.add(m)));
    return [...s].sort((a, b) => a.localeCompare(b, "fr"));
  }, [games]);

  // Mécaniques détestées par au moins un membre de la tablée : aucun jeu qui en
  // comporte une ne sera proposé, quelle que soit la section.
  const hatedMechs = useMemo(() => {
    const s = new Set();
    users.filter((u) => chosen.includes(u.id)).forEach((u) => (u.hatedMechanics || []).forEach((m) => s.add(m)));
    return s;
  }, [users, chosen]);

  // Enfants présents dans la tablée (comptes « tétine »).
  const childrenAtTable = useMemo(
    () => users.filter((u) => chosen.includes(u.id) && isChildAccount(u)),
    [users, chosen]
  );
  const tableHasChild = childrenAtTable.length > 0;

  // Le mode par défaut suit la composition de la tablée :
  // - un enfant présent  → on ne propose que les jeux pour enfants ;
  // - que des adultes    → les jeux pour enfants sont masqués.
  // (le choix manuel reste possible, il est simplement réinitialisé si la tablée change)
  useEffect(() => { setKidsMode(tableHasChild ? "only" : "exclude"); }, [tableHasChild]);

  // Nombre de joueurs effectif : choix manuel prioritaire, sinon la taille de la tablée.
  const effPlayers = players ? Number(players) : chosen.length;

  // Helpers de filtrage communs aux trois sections
  const matchPlayers = (g) => {
    if (!effPlayers) return true;
    const min = Number(g.min) || 1;
    const max = g.max ? Number(g.max) : Infinity;
    if (players === "7") return max >= 7;
    // Le jeu doit pouvoir accueillir toute la tablée (min ≤ N ≤ max).
    return effPlayers >= min && effPlayers <= max;
  };
  const matchDuration = (g) => {
    if (!duration) return true;
    const t = Number(g.time) || 0;
    if (t <= 0) return false; // durée inconnue : exclu quand une borne est choisie
    if (duration === "181") return t > 180;
    const [lo, hi] = duration.split("-").map(Number);
    return t >= lo && t <= hi;
  };
  const matchMech = (g) => mechFilter.length === 0 || mechFilter.every((m) => (g.mechanics || []).includes(m));
  const noHatedMech = (g) => hatedMechs.size === 0 || !(g.mechanics || []).some((m) => hatedMechs.has(m));
  // Jeux pour enfants selon le mode choisi
  const matchKids = (g) => (kidsMode === "only" ? isKidsGame(g) : kidsMode === "exclude" ? !isKidsGame(g) : true);
  // Jeux « one shot » : écartés tant que la case n'est pas cochée
  const matchOneShot = (g) => showOneShot || !isOneShotGame(g);
  const passFilters = (g) => matchPlayers(g) && matchDuration(g) && matchMech(g) && noHatedMech(g) && matchKids(g) && matchOneShot(g);

  // Calcul des trois sections : envies de découverte, mieux notés par la tablée, exploration ludique
  const { discoverGames, regularGames, exploreGames } = useMemo(() => {
    if (chosen.length === 0) return { discoverGames: [], regularGames: [], exploreGames: [] };
    const chosenSet = new Set(chosen);
    const chosenUsers = users.filter((u) => chosenSet.has(u.id));

    // moyenne des notes de la tablée pour un jeu (0 si aucune note)
    const tableAvg = (g) => {
      const vals = Object.entries(g.ratings || {}).filter(([uid]) => chosenSet.has(uid)).map(([, v]) => v);
      return vals.length ? vals.reduce((s, v) => s + v, 0) / vals.length : 0;
    };
    const tableRatings = (g) => Object.entries(g.ratings || {}).filter(([uid]) => chosenSet.has(uid));

    // --- Section 1 : envies de découverte de la tablée ---
    let discover = games
      .map((g) => {
        const wantersInTable = (g.wantIds || []).filter((id) => chosenSet.has(id));
        return { ...g, _wantCount: wantersInTable.length, _wanters: wantersInTable };
      })
      .filter((g) => g._wantCount > 0 && passFilters(g));
    discover.sort((a, b) => {
      if (b._wantCount !== a._wantCount) return b._wantCount - a._wantCount;
      const d = tableAvg(b) - tableAvg(a);
      if (d !== 0) return d;
      const pa = a.playCount || 0, pb = b.playCount || 0;
      if (pa !== pb) return pa - pb;
      return a.name.localeCompare(b.name, "fr");
    });
    const discoverIds = new Set(discover.map((g) => g.id));

    // --- Section 2 : mieux notés par la tablée ---
    // À partir de 3 participants, un jeu doit être noté par au moins 2 d'entre eux.
    const minVotes = chosen.length >= 3 ? 2 : 1;
    let regular = rankGames(games, chosen, true).filter((g) => g._count >= minVotes && passFilters(g));
    regular = regular.filter((g) => !discoverIds.has(g.id));

    // --- Section 3 : exploration ludique ---
    // Mélange de trois signaux : mécaniques favorites des participants (profils),
    // coups de coeur solo (jeu très bien noté par un seul participant),
    // et goûts des membres non participants dont le profil est proche de la tablée.
    const usedIds = new Set([...discoverIds, ...regular.map((g) => g.id)]);

    // (a) mécaniques favorites : pondérées par le nombre de participants qui les aiment
    const favCount = {};
    chosenUsers.forEach((u) => (u.favMechanics || []).forEach((m) => { favCount[m] = (favCount[m] || 0) + 1; }));

    // (b) proximité des non-participants avec la tablée, d'après l'écart de leurs notes communes.
    // Un membre est jugé « proche de la tablée » s'il partage des notes avec au moins
    // la majorité des participants et que ses notes ressemblent aux leurs.
    const ratingsByUser = {};
    games.forEach((g) => Object.entries(g.ratings || {}).forEach(([uid, v]) => { (ratingsByUser[uid] ||= {})[g.id] = v; }));
    const majority = Math.ceil(chosen.length / 2);
    const tableSim = {}; // uid non participant -> proximité 0..1
    Object.entries(ratingsByUser).forEach(([uid, mine]) => {
      if (chosenSet.has(uid)) return;
      let simSum = 0, simN = 0;
      chosen.forEach((pid) => {
        const theirs = ratingsByUser[pid] || {};
        let d = 0, n = 0;
        Object.entries(mine).forEach(([gid, v]) => { if (theirs[gid] != null) { d += Math.abs(theirs[gid] - v); n++; } });
        if (n > 0) { simSum += 1 - (d / n) / 5; simN++; }
      });
      if (simN >= majority) tableSim[uid] = simSum / simN;
    });

    let explore = games
      .filter((g) => !usedIds.has(g.id) && passFilters(g))
      .map((g) => {
        const tr = tableRatings(g);
        const solo = tr.length === 1 ? Number(tr[0][1]) : 0;
        // Un jeu mal noté (≤ 2) par un participant n'a rien à faire dans l'exploration.
        if (solo > 0 && solo <= 2) return null;
        const soloRater = tr.length === 1 ? (users.find((u) => u.id === tr[0][0])?.name || "") : "";
        const soloScore = solo >= 4 ? solo / 5 : 0; // seul un « très bien noté » compte

        // mécaniques favorites de la tablée présentes sur ce jeu
        const mechPts = (g.mechanics || []).reduce((s, m) => s + (favCount[m] || 0), 0);
        const mechScore = Math.min(1, mechPts / Math.max(1, chosen.length));

        // profils proches (non participants) ayant noté ce jeu
        let wSum = 0, wTot = 0;
        Object.entries(g.ratings || {}).forEach(([uid, v]) => {
          const sim = tableSim[uid];
          if (sim != null && sim > 0.5) { wSum += sim * v; wTot += sim; }
        });
        const peerScore = wTot > 0 ? (wSum / wTot) / 5 : 0;

        const st = gameStats(g);
        const globalScore = st.count > 0 ? st.avg / 5 : 0;

        const score = 0.35 * mechScore + 0.3 * soloScore + 0.25 * peerScore + 0.1 * globalScore;
        if (score <= 0) return null; // aucun signal : on n'encombre pas la section

        // raison principale affichée (la composante pondérée la plus forte)
        const parts = [
          [0.3 * soloScore, soloRater ? `Coup de coeur de ${soloRater} (${String(solo).replace(".", ",")}/5)` : ""],
          [0.35 * mechScore, "Mécaniques appréciées par la tablée"],
          [0.25 * peerScore, "Apprécié par des profils proches de la tablée"],
          [0.1 * globalScore, "Bien noté par l'association"],
        ].filter(([v, label]) => v > 0 && label);
        parts.sort((a, b) => b[0] - a[0]);
        const reason = parts.length ? parts[0][1] : "";

        return { ...g, _score: score, _reason: reason, _globalAvg: st.avg, _globalCount: st.count };
      })
      .filter(Boolean);
    explore.sort((a, b) => {
      if (b._score !== a._score) return b._score - a._score;
      if (b._globalAvg !== a._globalAvg) return b._globalAvg - a._globalAvg;
      return a.name.localeCompare(b.name, "fr");
    });

    return { discoverGames: discover, regularGames: regular, exploreGames: explore };
  }, [games, users, chosen, players, duration, mechFilter, hatedMechs, kidsMode, showOneShot]);

  // Réinitialise les limites d'affichage quand les critères changent
  useEffect(() => { setLimits({ discover: STEP, regular: STEP, explore: STEP }); }, [chosen, players, duration, mechFilter, kidsMode, showOneShot]);

  // Comptages indicatifs pour la zone « jeux enfants / one shot »
  const kidsTotal = useMemo(() => games.filter(isKidsGame).length, [games]);
  const oneShotTotal = useMemo(() => games.filter(isOneShotGame).length, [games]);

  // Bouton « Afficher plus » commun aux trois sections
  const MoreBtn = ({ total, shown, onMore }) => total > shown ? (
    <button onClick={onMore} style={{
      marginTop: 8, width: "100%", padding: "9px 16px", borderRadius: 11, border: `1.5px dashed ${C.teal}`, background: "rgba(30,138,138,.05)",
      color: C.teal, cursor: "pointer", fontFamily: "'Fredoka',sans-serif", fontWeight: 700, fontSize: 13.5,
    }}>Afficher {Math.min(STEP, total - shown)} jeu{Math.min(STEP, total - shown) > 1 ? "x" : ""} de plus ({total - shown} restant{total - shown > 1 ? "s" : ""})</button>
  ) : null;

  return (
    <Modal open onClose={onClose} title="Classement pour votre tablée" width={620}>
      <p style={{ fontSize: 14, color: "#6e6256", margin: "0 0 16px", lineHeight: 1.5 }}>
        Sélectionnez les membres présents : les propositions sont automatiquement filtrées pour un jeu jouable par <b>toute la tablée</b>, et les mécaniques détestées par un participant sont exclues.
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 18 }}>
        {users.map((u) => {
          const active = chosen.includes(u.id);
          return (
            <button key={u.id} onClick={() => toggle(u.id)} style={{
              display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", borderRadius: 999, cursor: "pointer",
              border: `2px solid ${active ? C.teal : "#e6dcc9"}`, background: active ? C.teal : "#fff", color: active ? "#fff" : C.navy,
              fontFamily: "'Fredoka',sans-serif", fontWeight: 600, fontSize: 14, transition: "all .12s",
            }}>
              {active && <Check size={15} />} {u.name}
              {isChildAccount(u) && <PacifierIcon size={13} color={active ? "#fff" : C.purple} />}
            </button>
          );
        })}
      </div>

      {/* filtres joueurs + durée */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
        <select value={players} onChange={(e) => setPlayers(e.target.value)} style={{ ...inputStyle, width: "auto", cursor: "pointer", fontFamily: "'Fredoka',sans-serif", fontWeight: 600 }}>
          <option value="">{chosen.length > 0 ? `Joueurs : auto (${chosen.length} — la tablée)` : "Nombre de joueurs : tous"}</option>
          <option value="1">1 joueur</option>
          <option value="2">2 joueurs</option>
          <option value="3">3 joueurs</option>
          <option value="4">4 joueurs</option>
          <option value="5">5 joueurs</option>
          <option value="6">6 joueurs</option>
          <option value="7">7+ joueurs</option>
        </select>
        <select value={duration} onChange={(e) => setDuration(e.target.value)} style={{ ...inputStyle, width: "auto", cursor: "pointer", fontFamily: "'Fredoka',sans-serif", fontWeight: 600 }}>
          <option value="">Durée : toutes</option>
          <option value="0-30">Entre 0 et 30 min</option>
          <option value="31-60">Entre 31 min et 1 h</option>
          <option value="61-90">Entre 1 h et 1 h 30</option>
          <option value="91-120">Entre 1 h 30 et 2 h</option>
          <option value="121-180">Entre 2 h et 3 h</option>
          <option value="181">3 h et plus</option>
        </select>
      </div>

      {/* Rappel des mécaniques exclues par la tablée */}
      {hatedMechs.size > 0 && (
        <div style={{ background: "rgba(181,40,58,.07)", border: "1px solid rgba(181,40,58,.2)", borderRadius: 11, padding: "9px 13px", marginBottom: 16, fontSize: 12.5, color: C.red, lineHeight: 1.5 }}>
          🚫 <b>Mécaniques exclues</b> (détestées par au moins un participant) : {[...hatedMechs].sort((a, b) => a.localeCompare(b, "fr")).join(", ")}
        </div>
      )}

      {/* Zone dédiée : jeux pour enfants + jeux one shot */}
      <div style={{ background: tableHasChild ? "rgba(107,58,122,.07)" : "rgba(26,58,92,.04)", border: `1.5px solid ${tableHasChild ? C.purple + "44" : "#ece2d0"}`, borderRadius: 14, padding: "13px 15px", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <PacifierIcon size={16} />
          <span style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 700, color: C.navy, fontSize: 14 }}>Jeux pour enfants</span>
          <span style={{ fontSize: 12, color: "#9c8d79" }}>({kidsTotal} dans la ludothèque)</span>
        </div>
        <p style={{ margin: "0 0 10px", fontSize: 12.5, color: "#8a7c6a", lineHeight: 1.5 }}>
          {tableHasChild
            ? <>👶 <b style={{ color: C.purple }}>{childrenAtTable.map((u) => u.name).join(", ")}</b> {childrenAtTable.length > 1 ? "sont" : "est"} à la tablée : seuls les jeux pour enfants sont proposés. Vous pouvez élargir ci-dessous.</>
            : <>Entre adultes, les jeux pour enfants sont <b>masqués automatiquement</b>. Cliquez ci-dessous pour les réintégrer aux propositions, ou pour n'afficher qu'eux.</>}
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
          {[
            { v: "exclude", t: tableHasChild ? "Sans les jeux enfants" : "Masqués (par défaut)" },
            { v: "include", t: "Enfants + tous les autres" },
            { v: "only",    t: "Uniquement les jeux enfants" },
          ].map((opt) => {
            const active = kidsMode === opt.v;
            return (
              <button key={opt.v} type="button" onClick={() => setKidsMode(opt.v)} style={{
                padding: "7px 13px", borderRadius: 999, cursor: "pointer", fontFamily: "'Fredoka',sans-serif", fontWeight: 600, fontSize: 12.5,
                border: `2px solid ${active ? C.purple : "#e6dcc9"}`, background: active ? C.purple : "#fff", color: active ? "#fff" : "#8a7c6a",
              }}>{active && <Check size={12} style={{ verticalAlign: "-1px", marginRight: 4 }} />}{opt.t}</button>
            );
          })}
        </div>

        <label style={{ display: "flex", alignItems: "flex-start", gap: 10, marginTop: 13, paddingTop: 12, borderTop: "1px solid rgba(26,58,92,.09)", cursor: "pointer" }}>
          <input type="checkbox" checked={showOneShot} onChange={(e) => setShowOneShot(e.target.checked)} style={{ width: 17, height: 17, accentColor: C.amber, marginTop: 2, flexShrink: 0 }} />
          <span style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 600, color: C.navy, fontSize: 13.5 }}>
            Inclure les jeux «&nbsp;one shot&nbsp;» <span style={{ fontSize: 12, color: "#9c8d79", fontWeight: 400 }}>({oneShotTotal} jeu{oneShotTotal > 1 ? "x" : ""})</span>
            <span style={{ display: "block", fontSize: 12.5, color: "#8a7c6a", fontWeight: 400, lineHeight: 1.5, marginTop: 2 }}>
              {ONE_SHOT_MECHANICS.join(", ")} — masqués par défaut : une fois l'histoire connue, l'intérêt d'y rejouer retombe.
            </span>
          </span>
        </label>
      </div>

      {/* Filtre mécaniques (multi-sélection) */}
      {allMechanics.length > 0 && (
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 12.5, color: "#8a7c6a", fontFamily: "'Fredoka',sans-serif", fontWeight: 600, marginBottom: 8 }}>
            Filtrer par mécaniques {mechFilter.length > 0 && <span style={{ color: C.teal }}>({mechFilter.length} sélectionnée{mechFilter.length > 1 ? "s" : ""})</span>}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, maxHeight: 110, overflowY: "auto" }}>
            {allMechanics.map((m) => {
              const active = mechFilter.includes(m);
              return (
                <button key={m} onClick={() => toggleMech(m)} style={{
                  padding: "5px 11px", borderRadius: 999, cursor: "pointer", fontFamily: "'Nunito',sans-serif", fontWeight: 600, fontSize: 12.5,
                  border: `1.5px solid ${active ? C.purple : "#e6dcc9"}`, background: active ? C.purple : "#fff", color: active ? "#fff" : "#6e6256",
                }}>{m}</button>
              );
            })}
          </div>
          {mechFilter.length > 0 && <button onClick={() => setMechFilter([])} style={{ marginTop: 8, background: "none", border: "none", color: C.red, cursor: "pointer", fontSize: 12.5, fontFamily: "'Fredoka',sans-serif", fontWeight: 600 }}>Effacer les mécaniques</button>}
        </div>
      )}

      {chosen.length === 0 ? (
        <EmptyHint icon={Users} text="Sélectionnez au moins un membre." />
      ) : (discoverGames.length === 0 && regularGames.length === 0 && exploreGames.length === 0) ? (
        <EmptyHint icon={Star} text={kidsMode === "only"
          ? "Aucun jeu pour enfants ne correspond à ces filtres. Élargissez avec « Enfants + tous les autres »."
          : "Aucun jeu ne correspond à ces filtres."} />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr)", gap: 18 }}>
          {/* Section 1 : envies de découverte de la tablée */}
          {discoverGames.length > 0 && (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <Heart size={16} fill={C.red} color={C.red} />
                <h4 style={{ fontFamily: "'Fredoka',sans-serif", color: C.navy, fontSize: 15, margin: 0 }}>Envies de découverte ({discoverGames.length})</h4>
              </div>
              <p style={{ fontSize: 12, color: "#9c8d79", margin: "0 0 8px" }}>Jeux qu'au moins un membre de la tablée souhaite découvrir — l'occasion parfaite !</p>
              <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr)", gap: 8 }}>
                {discoverGames.slice(0, limits.discover).map((g, i) => {
                  const wanterNames = g._wanters.map((id) => users.find((u) => u.id === id)?.name).filter(Boolean).join(", ");
                  return (
                    <button key={g.id} onClick={() => onOpenGame(g.id)} style={{ display: "flex", alignItems: "center", gap: 14, background: i === 0 ? "rgba(181,40,58,.1)" : "rgba(181,40,58,.04)", border: `1px solid ${i === 0 ? "rgba(181,40,58,.3)" : "rgba(181,40,58,.15)"}`, borderRadius: 13, padding: "11px 16px", cursor: "pointer", textAlign: "left" }}>
                      <span style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 700, fontSize: 20, color: C.red, width: 26 }}>{i + 1}</span>
                      <span style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ display: "block", fontFamily: "'Fredoka',sans-serif", fontWeight: 700, color: C.navy, fontSize: 15.5 }}>{g.name}</span>
                        <span style={{ fontSize: 12, color: "#9c8d79" }}>
                          <b style={{ color: C.red }}>{g._wantCount} envie{g._wantCount > 1 ? "s" : ""}</b> ({wanterNames}) · {g.min || "?"}{g.max && g.max !== g.min ? `-${g.max}` : ""} j.{g.time ? ` · ${g.time} min` : ""}
                        </span>
                      </span>
                      <span style={{ display: "flex", alignItems: "center", gap: 5, color: C.red, fontFamily: "'Fredoka',sans-serif", fontWeight: 700, fontSize: 18 }}>
                        <Heart size={16} fill={C.red} /> {g._wantCount}
                      </span>
                    </button>
                  );
                })}
              </div>
              <MoreBtn total={discoverGames.length} shown={limits.discover} onMore={() => setLimits((l) => ({ ...l, discover: l.discover + STEP }))} />
            </div>
          )}

          {/* Section 2 : classement classique sur les notes */}
          {regularGames.length > 0 && (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <Star size={16} fill={C.amber} color={C.amber} />
                <h4 style={{ fontFamily: "'Fredoka',sans-serif", color: C.navy, fontSize: 15, margin: 0 }}>Mieux notés par la tablée ({regularGames.length})</h4>
              </div>
              <p style={{ fontSize: 12, color: "#9c8d79", margin: "0 0 8px" }}>{chosen.length >= 3 ? "Jeux notés par au moins 2 participants" : `${chosen.length} membre(s)`} · à note égale, les jeux les moins joués remontent.</p>
              <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr)", gap: 8 }}>
                {regularGames.slice(0, limits.regular).map((g, i) => (
                  <button key={g.id} onClick={() => onOpenGame(g.id)} style={{ display: "flex", alignItems: "center", gap: 14, background: i === 0 ? "rgba(232,163,23,.1)" : "rgba(26,58,92,.04)", border: "none", borderRadius: 13, padding: "11px 16px", cursor: "pointer", textAlign: "left" }}>
                    <span style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 700, fontSize: 20, color: i === 0 ? C.amber : "#b6a78f", width: 26 }}>{i + 1}</span>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: "block", fontFamily: "'Fredoka',sans-serif", fontWeight: 700, color: C.navy, fontSize: 15.5 }}>{g.name}</span>
                      <span style={{ fontSize: 12, color: "#9c8d79" }}>
                        {g._count} vote(s) parmi la sélection · {g.min || "?"}{g.max && g.max !== g.min ? `-${g.max}` : ""} j.{g.time ? ` · ${g.time} min` : ""}
                        {" · "}<span style={{ color: (g.playCount || 0) === 0 ? C.teal : "#9c8d79", fontWeight: (g.playCount || 0) === 0 ? 700 : 400 }}>{(g.playCount || 0) === 0 ? "jamais joué" : `joué ${g.playCount} fois`}</span>
                      </span>
                    </span>
                    <span style={{ display: "flex", alignItems: "center", gap: 5, color: C.amber, fontFamily: "'Fredoka',sans-serif", fontWeight: 700, fontSize: 17 }}>
                      <Star size={16} fill={C.amber} /> {g._avg.toFixed(2).replace(".", ",")}
                    </span>
                  </button>
                ))}
              </div>
              <MoreBtn total={regularGames.length} shown={limits.regular} onMore={() => setLimits((l) => ({ ...l, regular: l.regular + STEP }))} />
            </div>
          )}

          {/* Section 3 : exploration ludique */}
          {exploreGames.length > 0 && (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <Sparkles size={16} color={C.teal} />
                <h4 style={{ fontFamily: "'Fredoka',sans-serif", color: C.navy, fontSize: 15, margin: 0 }}>Exploration ludique ({exploreGames.length})</h4>
              </div>
              <p style={{ fontSize: 12, color: "#9c8d79", margin: "0 0 8px" }}>Suggestions basées sur les mécaniques favorites des participants, leurs coups de coeur individuels et les goûts des membres au profil proche de la tablée.</p>
              <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr)", gap: 8 }}>
                {exploreGames.slice(0, limits.explore).map((g, i) => (
                  <button key={g.id} onClick={() => onOpenGame(g.id)} style={{ display: "flex", alignItems: "center", gap: 14, background: "rgba(30,138,138,.05)", border: "1px solid rgba(30,138,138,.12)", borderRadius: 13, padding: "11px 16px", cursor: "pointer", textAlign: "left" }}>
                    <span style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 700, fontSize: 18, color: "#b6a78f", width: 26 }}>{i + 1}</span>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: "block", fontFamily: "'Fredoka',sans-serif", fontWeight: 700, color: C.navy, fontSize: 15.5 }}>{g.name}</span>
                      {g._reason && <span style={{ display: "block", fontSize: 12, color: C.teal, fontWeight: 700 }}>{g._reason}</span>}
                      <span style={{ fontSize: 12, color: "#9c8d79" }}>
                        {g._globalCount > 0 ? `${g._globalCount} vote(s) dans l'asso` : "pas encore noté"} · {g.min || "?"}{g.max && g.max !== g.min ? `-${g.max}` : ""} j.{g.time ? ` · ${g.time} min` : ""}
                        {" · "}<span style={{ color: (g.playCount || 0) === 0 ? C.teal : "#9c8d79", fontWeight: (g.playCount || 0) === 0 ? 700 : 400 }}>{(g.playCount || 0) === 0 ? "jamais joué" : `joué ${g.playCount} fois`}</span>
                      </span>
                    </span>
                    {g._globalCount > 0 && (
                      <span style={{ display: "flex", alignItems: "center", gap: 5, color: C.teal, fontFamily: "'Fredoka',sans-serif", fontWeight: 700, fontSize: 16 }}>
                        <Star size={15} fill={C.teal} /> {g._globalAvg.toFixed(2).replace(".", ",")}
                      </span>
                    )}
                  </button>
                ))}
              </div>
              <MoreBtn total={exploreGames.length} shown={limits.explore} onMore={() => setLimits((l) => ({ ...l, explore: l.explore + STEP }))} />
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}

/* =============================================================================
   AJOUT DE JEU — import BGG / TricTrac / manuel
   ============================================================================= */
function AddGameFlow({ onClose, setToast }) {
  const { addGame } = useApp();
  const [mode, setMode] = useState("choose"); // choose | bgg | manual
  const [prefillName, setPrefillName] = useState("");
  return (
    <Modal open onClose={onClose} title="Ajouter un jeu à la ludothèque" width={640}>
      {mode === "choose" && (
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr)", gap: 12 }}>
          <p style={{ fontSize: 14, color: "#6e6256", margin: "0 0 4px", lineHeight: 1.5 }}>Comment souhaitez-vous ajouter ce jeu ? L'import récupère automatiquement la fiche (joueurs, durée, image, mécaniques) et traduit la description en français.</p>
          <SourceBtn icon={Globe} color={C.teal} title="Importer depuis BoardGameGeek" desc="Recherche dans la plus grande base mondiale + traduction auto en français." onClick={() => setMode("bgg")} />
          <SourceBtn icon={PenLine} color={C.amber} title="Saisir manuellement" desc="Remplissez vous-même la fiche du jeu (toujours disponible)." onClick={() => { setPrefillName(""); setMode("manual"); }} />
        </div>
      )}
      {mode === "bgg" && <BggImport onBack={() => setMode("choose")} onManual={(name) => { setPrefillName(name); setMode("manual"); }} onDone={async (data, msg) => { if (data) { await addGame({ ...data, source: "BoardGameGeek" }); } onClose(); setToast(msg || `« ${data?.name} » ajouté !`); }} />}
      {mode === "manual" && <ManualForm prefillName={prefillName} onBack={() => setMode("choose")} onDone={async (data, msg) => { if (data) { await addGame({ ...data, source: "manuel" }); } onClose(); setToast(msg || `« ${data?.name} » ajouté !`); }} />}
    </Modal>
  );
}

function SourceBtn({ icon: Icon, color, title, desc, onClick, badge }) {
  return (
    <button onClick={onClick} style={{ display: "flex", gap: 14, alignItems: "center", textAlign: "left", padding: "16px 18px", borderRadius: 16, border: "2px solid #ece2d0", background: "#fff", cursor: "pointer", transition: "border-color .15s" }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = color)} onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#ece2d0")}>
      <span style={{ width: 48, height: 48, borderRadius: 13, background: `${color}1a`, display: "grid", placeItems: "center", flexShrink: 0 }}><Icon size={24} color={color} /></span>
      <span style={{ flex: 1 }}>
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 700, color: C.navy, fontSize: 16 }}>{title}</span>
          {badge && <Badge color={color}>{badge}</Badge>}
        </span>
        <span style={{ fontSize: 13, color: "#8a7c6a" }}>{desc}</span>
      </span>
      <ChevronRight size={20} color="#cdb9a0" />
    </button>
  );
}

function BggImport({ onBack, onDone, onManual, forUpcoming = false }) {
  const { games, upcoming, users, currentUser, addOwner } = useApp();
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [failed, setFailed] = useState(false); // l'import a échoué → proposer le manuel
  const [importing, setImporting] = useState(null);
  const [translating, setTranslating] = useState(false);
  const [preview, setPreview] = useState(null);
  const [saving, setSaving] = useState(false); // anti double-clic : verrouille la validation pendant la création
  // Procuration : ne s'applique que pour la ludothèque (pas pour les fiches À venir).
  const [ownership, setOwnership] = useState("self");
  const [forUserIds, setForUserIds] = useState([]);
  const toggleForUser = (uid) => setForUserIds((arr) => arr.includes(uid) ? arr.filter((x) => x !== uid) : [...arr, uid]);
  const otherUsers = useMemo(() => (users || []).filter((u) => u.id !== currentUser?.id).sort((a, b) => a.name.localeCompare(b.name, "fr")), [users, currentUser]);

  // jeux déjà présents dans la base au nom proche de la recherche
  // jeux déjà présents dans la base au nom proche de la recherche
  const existing = useMemo(() => findSimilarGames(games, q), [games, q]);
  // fiches À venir au nom proche (détection inter-sections)
  const existingUpcoming = useMemo(() => findSimilarGames(upcoming || [], q), [upcoming, q]);

  const search = async () => {
    if (!q.trim()) return;
    setLoading(true); setErr(""); setFailed(false); setResults([]);
    try {
      const r = await bggSearch(q.trim());
      if (r.length === 0) setErr("Aucun résultat. Essayez un autre nom (souvent le titre anglais fonctionne mieux).");
      setResults(r);
    } catch (e) {
      setErr("BoardGameGeek est momentanément inaccessible (cela arrive parfois). Vous pouvez réessayer dans un instant, ou saisir le jeu manuellement — c'est tout aussi rapide.");
      setFailed(true);
    }
    setLoading(false);
  };

  const pick = async (r) => {
    setImporting(r.id); setErr(""); setFailed(false);
    try {
      const d = await bggDetails(r.id);
      setTranslating(true);
      // La traduction et la conversion des mécaniques ne doivent JAMAIS empêcher
      // l'affichage de l'aperçu éditable. On les protège individuellement.
      let desc = d.desc;
      try { desc = await translateText(d.desc); } catch (e) { /* on garde la VO */ }
      let mechanics = d.mechanics || [];
      try { mechanics = translateMechanics(d.mechanics); } catch (e) { /* on garde les mécaniques d'origine */ }
      setTranslating(false);
      // On conserve le nom sur lequel l'utilisateur a cliqué dans la recherche
      // (souvent le titre français) plutôt que le nom "primaire" de BGG, qui
      // est presque toujours le titre anglais.
      setPreview({ ...d, name: r.name || d.name, desc, mechanics });
    } catch (e) {
      setErr("Impossible de récupérer cette fiche pour le moment. Réessayez ou saisissez-la manuellement.");
      setFailed(true);
      setTranslating(false);
    }
    setImporting(null);
  };

  if (preview) {
    // Helpers locaux pour modifier les champs du preview
    const updatePreview = (patch) => setPreview({ ...preview, ...patch });
    const toggleMech = (m) => {
      const arr = preview.mechanics || [];
      updatePreview({ mechanics: arr.includes(m) ? arr.filter((x) => x !== m) : [...arr, m] });
    };
    const addCustomMech = (m) => {
      const trimmed = m.trim();
      if (!trimmed) return;
      const arr = preview.mechanics || [];
      if (!arr.includes(trimmed)) updatePreview({ mechanics: [...arr, trimmed] });
    };
    return (
      <div>
        <button onClick={() => setPreview(null)} style={backLinkStyle}><ChevronRight size={15} style={{ transform: "rotate(180deg)" }} /> Autre jeu</button>
        <div style={{ borderRadius: 14, overflow: "hidden", marginBottom: 16 }}><GameCover g={preview} size="lg" /></div>
        <Field label="Image" hint="L'image BoardGameGeek est reprise par défaut — remplacez-la par une adresse web ou une image de votre appareil si vous préférez.">
          <ImageField value={preview.img || ""} onChange={(v) => updatePreview({ img: v })} />
        </Field>

        {/* Bandeau d'info : la fiche est modifiable avant validation */}
        <div style={{ background: "rgba(232,163,23,.08)", border: "1px solid rgba(232,163,23,.25)", borderRadius: 11, padding: "10px 14px", marginBottom: 14, fontSize: 13, color: "#6e6256", display: "flex", alignItems: "center", gap: 8 }}>
          <Info size={15} color={C.amber} /> Vous pouvez modifier les champs ci-dessous avant de valider.
        </div>

        {/* Champs éditables */}
        <Field label="Nom du jeu" hint="Le nom choisi dans la recherche est conservé. BGG étant un site américain, vérifiez qu'il s'agit bien du titre de l'édition française."><TextInput value={preview.name || ""} onChange={(e) => updatePreview({ name: e.target.value })} /></Field>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10 }}>
          <Field label="Année"><TextInput type="number" value={preview.year || ""} onChange={(e) => updatePreview({ year: Number(e.target.value) || "" })} /></Field>
          <Field label="Joueurs min"><TextInput type="number" value={preview.min || ""} onChange={(e) => updatePreview({ min: Number(e.target.value) || "" })} /></Field>
          <Field label="Joueurs max"><TextInput type="number" value={preview.max || ""} onChange={(e) => updatePreview({ max: Number(e.target.value) || "" })} /></Field>
          <Field label="Durée (min)"><TextInput type="number" value={preview.time || ""} onChange={(e) => updatePreview({ time: Number(e.target.value) || "" })} /></Field>
        </div>
        <Field label="Prix neuf (€)" hint="Facultatif — sert notamment au calcul du tarif de location.">
          <TextInput type="number" step="0.01" value={preview.newPrice ?? ""} onChange={(e) => updatePreview({ newPrice: e.target.value })} placeholder="50" />
        </Field>

        <Field label="Mécaniques" hint="Décochez celles avec lesquelles vous n'êtes pas d'accord, cochez-en d'autres, ou ajoutez-en de personnalisées.">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {[...new Set([...MECHANIC_SUGGESTIONS, ...(preview.mechanics || [])])].map((m) => {
              const active = (preview.mechanics || []).includes(m);
              return <button key={m} type="button" onClick={() => toggleMech(m)} style={{ padding: "6px 12px", borderRadius: 999, cursor: "pointer", fontFamily: "'Fredoka',sans-serif", fontWeight: 600, fontSize: 12.5, border: `2px solid ${active ? C.purple : "#e6dcc9"}`, background: active ? C.purple : "#fff", color: active ? "#fff" : "#8a7c6a" }}>{m}</button>;
            })}
          </div>
          <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
            <TextInput placeholder="Ajouter une mécanique personnalisée et appuyer sur Entrée…" onKeyDown={(e) => {
              if (e.key === "Enter") { e.preventDefault(); addCustomMech(e.target.value); e.target.value = ""; }
            }} />
          </div>
        </Field>

        <Field label="Description">
          <textarea rows={5} value={preview.desc || ""} onChange={(e) => updatePreview({ desc: e.target.value })} style={{ ...inputStyle, resize: "vertical" }} />
          <div style={{ background: "rgba(30,138,138,.08)", borderRadius: 8, padding: "6px 10px", marginTop: 6, fontSize: 12, color: C.teal, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 5 }}>
            <Globe size={12} /> Description traduite automatiquement en français
          </div>
        </Field>

        <Field label="Lien Ludum (facultatif)" hint="Collez l'adresse de la fiche du jeu sur Ludum. Laissez vide : un bouton de recherche par nom sera proposé automatiquement.">
          <TextInput value={preview.ludumUrl || ""} onChange={(e) => updatePreview({ ludumUrl: e.target.value })} placeholder="https://www.ludum.fr/..." />
        </Field>

        {/* Bloc : qui possède ce jeu ? (uniquement pour la ludothèque, pas pour À venir) */}
        {!forUpcoming && (
          <Field label="Qui possède ce jeu ?" hint="Le membre concerné devra confirmer la possession dans Mon espace. Choisissez « Personne » pour créer une fiche de référence, utile pour enregistrer des parties jouées ailleurs.">
            <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr)", gap: 8 }}>
              {[
                { v: "self",  t: "Je le possède" },
                { v: "other", t: "Un autre membre le possède" },
                { v: "both",  t: "Plusieurs membres le possèdent (dont moi)" },
                { v: "none",  t: "Personne — fiche de référence" },
              ].map((opt) => {
                const active = ownership === opt.v;
                return (
                  <button key={opt.v} type="button" onClick={() => setOwnership(opt.v)}
                    style={{ display: "flex", gap: 12, alignItems: "center", padding: "9px 14px", borderRadius: 11, cursor: "pointer", textAlign: "left", border: `2px solid ${active ? C.teal : "#e6dcc9"}`, background: active ? "rgba(30,138,138,.06)" : "#fff" }}>
                    <span style={{ width: 18, height: 18, borderRadius: "50%", border: `2px solid ${active ? C.teal : "#c5b69c"}`, flexShrink: 0, display: "grid", placeItems: "center" }}>
                      {active && <span style={{ width: 8, height: 8, borderRadius: "50%", background: C.teal }} />}
                    </span>
                    <span style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 600, color: C.navy, fontSize: 14 }}>{opt.t}</span>
                  </button>
                );
              })}
            </div>
            {(ownership === "other" || ownership === "both") && (
              <div style={{ marginTop: 12, padding: "12px 14px", background: "rgba(232,163,23,.08)", borderRadius: 11 }}>
                <span style={{ display: "block", fontSize: 12.5, color: "#6e6256", marginBottom: 8 }}>Sélectionnez le ou les membres propriétaires :</span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {otherUsers.map((u) => {
                    const active = forUserIds.includes(u.id);
                    return (
                      <button key={u.id} type="button" onClick={() => toggleForUser(u.id)}
                        style={{ padding: "6px 12px", borderRadius: 999, cursor: "pointer", fontFamily: "'Fredoka',sans-serif", fontWeight: 600, fontSize: 12.5, border: `2px solid ${active ? C.amber : "#e6dcc9"}`, background: active ? C.amber : "#fff", color: active ? "#fff" : "#8a7c6a" }}>
                        {active && <Check size={12} style={{ verticalAlign: "-1px", marginRight: 3 }} />}{u.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </Field>
        )}

        {err && <div style={{ background: "rgba(181,40,58,.1)", color: C.red, padding: "10px 14px", borderRadius: 11, fontSize: 13.5, marginBottom: 12, lineHeight: 1.5 }}>{err}</div>}
        <Btn full size="lg" variant="teal" disabled={saving} onClick={async () => {
          if (saving) return; // anti double-clic : une création est déjà en cours
          if (!forUpcoming && ownership === "other" && forUserIds.length === 0) { setErr("Sélectionnez au moins un membre, ou choisissez « Je le possède »."); return; }
          setErr("");
          setSaving(true);
          try {
            // On attend la fin complète de la création (upload image + insertion)
            // avant de déverrouiller : c'est ce qui empêche les doublons.
            await onDone({
              ...preview,
              selfOwns: forUpcoming ? true : (ownership === "self" || ownership === "both"),
              forUserIds: forUpcoming ? [] : ((ownership === "other" || ownership === "both") ? forUserIds : []),
            });
          } finally { setSaving(false); }
        }}>{saving ? <Loader2 size={18} className="aladj-spin" /> : <Plus size={18} />} {saving ? "Ajout en cours..." : (forUpcoming ? "Ajouter aux jeux à venir" : "Ajouter à ma ludothèque")}</Btn>
      </div>
    );
  }

  return (
    <div>
      <button onClick={onBack} style={backLinkStyle}><ChevronRight size={15} style={{ transform: "rotate(180deg)" }} /> Retour</button>
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <div style={{ flex: 1, position: "relative" }}>
          <Search size={18} color="#b6a78f" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
          <TextInput value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && search()} placeholder="Nom du jeu (ex. Wingspan, Catan...)" style={{ paddingLeft: 42 }} autoFocus />
        </div>
        <Btn variant="teal" onClick={search} disabled={loading}>{loading ? <Loader2 size={17} className="aladj-spin" /> : "Chercher"}</Btn>
      </div>
      {translating && <div style={{ display: "flex", alignItems: "center", gap: 8, color: C.teal, fontSize: 13.5, marginBottom: 12, fontWeight: 600 }}><Loader2 size={15} className="aladj-spin" /> Traduction de la fiche en français...</div>}
      {err && <div style={{ background: "rgba(181,40,58,.1)", color: C.red, padding: "10px 14px", borderRadius: 11, fontSize: 13.5, marginBottom: 14, lineHeight: 1.5 }}>{err}</div>}

      {/* jeux déjà présents dans la ludothèque (évite les doublons) */}
      {existing.length > 0 && (
        <div style={{ background: "rgba(30,138,138,.08)", border: "1px solid rgba(30,138,138,.25)", borderRadius: 14, padding: 14, marginBottom: 14 }}>
          <span style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 700, color: C.teal, fontSize: 14, display: "block", marginBottom: 8 }}>Déjà dans la ludothèque</span>
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr)", gap: 8 }}>
            {existing.slice(0, 4).map((g) => {
              const alreadyMine = (g.ownerIds || []).includes(currentUser?.id);
              return (
                <div key={g.id} style={{ display: "flex", alignItems: "center", gap: 10, background: "#fff", borderRadius: 10, padding: "8px 10px" }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, flexShrink: 0, background: g.img ? `center/cover url("${g.img}")` : `linear-gradient(135deg,${C.teal},${C.purple})`, display: "grid", placeItems: "center" }}>
                    {!g.img && <span style={{ color: "#fff", fontFamily: "'Fredoka',sans-serif", fontWeight: 700, fontSize: 11 }}>{g.name.slice(0, 2).toUpperCase()}</span>}
                  </div>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: "block", fontFamily: "'Fredoka',sans-serif", fontWeight: 600, color: C.navy, fontSize: 13.5 }}>{g.name}</span>
                    <span style={{ display: "block", fontSize: 11.5, color: "#9c8d79" }}>{g.unowned ? "Fiche de référence — personne ne le possède" : `chez ${(g.owners || []).map((o) => o.name).join(", ")}`}</span>
                  </span>
                  {alreadyMine
                    ? <span style={{ fontSize: 12, color: C.teal, fontWeight: 700, fontFamily: "'Fredoka',sans-serif", padding: "0 6px" }}>✓ Vous l'avez</span>
                    : <Btn size="sm" variant="teal" onClick={async () => { await addOwner(g.id); onDone(null, "Ajouté à votre ludothèque !"); }}><Plus size={13} /> Je l'ai aussi</Btn>}
                </div>
              );
            })}
          </div>
        </div>
      )}
      {/* fiches À venir au nom proche (détection inter-sections) */}
      {existingUpcoming.length > 0 && (
        <div style={{ background: "rgba(232,163,23,.08)", border: "1px solid rgba(232,163,23,.3)", borderRadius: 14, padding: 14, marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <Sparkles size={15} color={C.amber} />
            <span style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 700, color: C.amber, fontSize: 14 }}>Aussi en « À venir »</span>
          </div>
          <p style={{ fontSize: 12, color: "#6e6256", margin: "0 0 8px" }}>Astuce : vous pouvez aussi utiliser le bouton <b>« Je l'ai ! »</b> depuis l'onglet À venir.</p>
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr)", gap: 4 }}>
            {existingUpcoming.slice(0, 3).map((u) => (
              <div key={u.id} style={{ fontSize: 13, color: "#5e5346", padding: "3px 8px", background: "#fff", borderRadius: 7 }}>
                • <b>{u.name}</b>{u.year ? ` (${u.year})` : ""}
              </div>
            ))}
          </div>
        </div>
      )}
      {failed && (
        <Btn full variant="amber" onClick={() => onManual(q.trim())} style={{ marginBottom: 14 }}>
          <PenLine size={16} /> Saisir « {q.trim() || "ce jeu"} » manuellement
        </Btn>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr)", gap: 8, maxHeight: 320, overflowY: "auto" }}>
        {results.map((r) => (
          <button key={r.id} onClick={() => pick(r)} disabled={importing} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderRadius: 12, border: "1px solid #ece2d0", background: "#fff", cursor: "pointer", textAlign: "left" }}>
            <span>
              <span style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 600, color: C.navy, fontSize: 15 }}>{r.name}</span>
              {r.year && <span style={{ color: "#b6a78f", fontSize: 13, marginLeft: 8 }}>{r.year}</span>}
            </span>
            {importing === r.id ? <Loader2 size={16} className="aladj-spin" color={C.teal} /> : <ChevronRight size={18} color="#cdb9a0" />}
          </button>
        ))}
      </div>
    </div>
  );
}
const backLinkStyle = { background: "none", border: "none", color: C.teal, fontFamily: "'Fredoka',sans-serif", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, marginBottom: 14, padding: 0, fontSize: 14 };

function ManualForm({ onBack, onDone, prefillName = "" }) {
  const { games, upcoming, users, currentUser, addOwner } = useApp();
  const [f, setF] = useState({ name: prefillName, year: "", min: "", max: "", time: "", desc: "", img: "", mechanics: [], ludumUrl: "", newPrice: "", scoreDirection: "" });
  const [err, setErr] = useState("");
  const [dismissed, setDismissed] = useState(false); // l'utilisateur a écarté la suggestion de doublon
  const [busy, setBusy] = useState(false); // anti double-clic : verrouille le bouton pendant la création
  // Procuration : "self" = je le possède / "other" = quelqu'un d'autre le possède.
  // forUserIds = les autres membres pour qui on déclare la possession.
  const [ownership, setOwnership] = useState("self");
  const [forUserIds, setForUserIds] = useState([]);
  const toggleMech = (m) => setF((s) => ({ ...s, mechanics: s.mechanics.includes(m) ? s.mechanics.filter((x) => x !== m) : [...s.mechanics, m] }));
  const toggleForUser = (uid) => setForUserIds((arr) => arr.includes(uid) ? arr.filter((x) => x !== uid) : [...arr, uid]);
  // Membres sélectionnables (tous sauf moi)
  const otherUsers = useMemo(() => (users || []).filter((u) => u.id !== currentUser?.id).sort((a, b) => a.name.localeCompare(b.name, "fr")), [users, currentUser]);

  // jeux existants au nom proche (qu'on les possède ou non)
  const similar = useMemo(() => {
    if (dismissed) return [];
    return findSimilarGames(games, f.name);
  }, [games, f.name, dismissed]);
  // fiches À venir au nom proche (détection inter-sections)
  const similarUpcoming = useMemo(() => {
    if (dismissed) return [];
    return findSimilarGames(upcoming || [], f.name);
  }, [upcoming, f.name, dismissed]);

  const submit = async () => {
    if (busy) return;
    if (!f.name.trim()) { setErr("Le nom du jeu est obligatoire."); return; }
    if (ownership === "other" && forUserIds.length === 0) {
      setErr("Sélectionnez au moins un membre qui possède ce jeu, ou choisissez « Je le possède »."); return;
    }
    setBusy(true);
    await onDone({
      ...f, name: f.name.trim(),
      year: Number(f.year) || "", min: Number(f.min) || "", max: Number(f.max) || "", time: Number(f.time) || "",
      selfOwns: ownership === "self" || ownership === "both",
      forUserIds: (ownership === "other" || ownership === "both") ? forUserIds : [],
    });
  };
  return (
    <div>
      <button onClick={onBack} style={backLinkStyle}><ChevronRight size={15} style={{ transform: "rotate(180deg)" }} /> Retour</button>
      <Field label="Nom du jeu *"><TextInput value={f.name} onChange={(e) => { setF({ ...f, name: e.target.value }); setDismissed(false); }} placeholder="Ex. Les Aventuriers du Rail" autoFocus /></Field>

      {/* encart : ce jeu existe peut-être déjà */}
      {similar.length > 0 && (
        <div style={{ background: "rgba(30,138,138,.08)", border: "1px solid rgba(30,138,138,.25)", borderRadius: 14, padding: 14, marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 700, color: C.teal, fontSize: 14 }}>Ce jeu existe peut-être déjà</span>
            <button onClick={() => setDismissed(true)} style={{ background: "none", border: "none", cursor: "pointer", color: "#9c8d79", fontSize: 12.5 }}>Ignorer</button>
          </div>
          <p style={{ fontSize: 12.5, color: "#6e6256", margin: "0 0 10px" }}>Inutile de recréer une fiche : cliquez sur « Je l'ai aussi » pour vous rattacher au jeu existant.</p>
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr)", gap: 8 }}>
            {similar.slice(0, 5).map((g) => {
              const alreadyMine = (g.ownerIds || []).includes(currentUser?.id);
              return (
                <div key={g.id} style={{ display: "flex", alignItems: "center", gap: 10, background: "#fff", borderRadius: 10, padding: "8px 10px" }}>
                  <div style={{ width: 38, height: 38, borderRadius: 8, flexShrink: 0, background: g.img ? `center/cover url("${g.img}")` : `linear-gradient(135deg,${C.teal},${C.purple})`, display: "grid", placeItems: "center" }}>
                    {!g.img && <span style={{ color: "#fff", fontFamily: "'Fredoka',sans-serif", fontWeight: 700, fontSize: 12 }}>{g.name.slice(0, 2).toUpperCase()}</span>}
                  </div>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: "block", fontFamily: "'Fredoka',sans-serif", fontWeight: 600, color: C.navy, fontSize: 14 }}>{g.name}</span>
                    <span style={{ display: "block", fontSize: 12, color: "#9c8d79" }}>{g.year ? `${g.year} · ` : ""}{g.unowned ? "Fiche de référence — personne ne le possède" : `chez ${(g.owners || []).map((o) => o.name).join(", ")}`}</span>
                  </span>
                  {alreadyMine
                    ? <span style={{ fontSize: 12, color: C.teal, fontWeight: 700, fontFamily: "'Fredoka',sans-serif", padding: "0 8px" }}>✓ Vous l'avez</span>
                    : <Btn size="sm" variant="teal" onClick={async () => { await addOwner(g.id); onDone(null, "Ajouté à votre ludothèque !"); }}><Plus size={13} /> Je l'ai aussi</Btn>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* encart : fiches À venir au nom proche (détection inter-sections) */}
      {similarUpcoming.length > 0 && (
        <div style={{ background: "rgba(232,163,23,.08)", border: "1px solid rgba(232,163,23,.3)", borderRadius: 14, padding: 14, marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <Sparkles size={15} color={C.amber} />
            <span style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 700, color: C.amber, fontSize: 14 }}>Une fiche « À venir » existe</span>
          </div>
          <p style={{ fontSize: 12.5, color: "#6e6256", margin: "0 0 10px" }}>Astuce : depuis la fiche « À venir » du jeu, cliquez sur <b>« Je l'ai ! »</b> — votre ludothèque sera créée en un clic, avec toutes les infos déjà remplies.</p>
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr)", gap: 6 }}>
            {similarUpcoming.slice(0, 3).map((u) => (
              <div key={u.id} style={{ fontSize: 13.5, color: "#5e5346", padding: "4px 8px", background: "#fff", borderRadius: 8 }}>
                • <b>{u.name}</b>{u.year ? ` (${u.year})` : ""}
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12 }}>
        <Field label="Année"><TextInput type="number" value={f.year} onChange={(e) => setF({ ...f, year: e.target.value })} /></Field>
        <Field label="Joueurs min"><TextInput type="number" value={f.min} onChange={(e) => setF({ ...f, min: e.target.value })} /></Field>
        <Field label="Joueurs max"><TextInput type="number" value={f.max} onChange={(e) => setF({ ...f, max: e.target.value })} /></Field>
        <Field label="Durée (min)"><TextInput type="number" value={f.time} onChange={(e) => setF({ ...f, time: e.target.value })} /></Field>
      </div>
      <Field label="Prix neuf (€)" hint="Facultatif — sert notamment au calcul du tarif de location.">
        <TextInput type="number" step="0.01" value={f.newPrice} onChange={(e) => setF({ ...f, newPrice: e.target.value })} placeholder="50" />
      </Field>
      <Field label="Mécaniques" hint="Cliquez pour sélectionner, ou ajoutez vos propres mécaniques ci-dessous.">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
          {[...new Set([...MECHANIC_SUGGESTIONS, ...(f.mechanics || [])])].map((m) => {
            const active = f.mechanics.includes(m);
            return <button key={m} type="button" onClick={() => toggleMech(m)} style={{ padding: "6px 12px", borderRadius: 999, cursor: "pointer", fontFamily: "'Fredoka',sans-serif", fontWeight: 600, fontSize: 12.5, border: `2px solid ${active ? C.purple : "#e6dcc9"}`, background: active ? C.purple : "#fff", color: active ? "#fff" : "#8a7c6a" }}>{m}</button>;
          })}
        </div>
        <div style={{ marginTop: 8 }}>
          <TextInput placeholder="Ajouter une mécanique personnalisée et appuyer sur Entrée…" onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              const v = e.target.value.trim();
              if (v && !f.mechanics.includes(v)) setF({ ...f, mechanics: [...f.mechanics, v] });
              e.target.value = "";
            }
          }} />
        </div>
      </Field>
      <ScoreDirectionField value={f.scoreDirection} onChange={(v) => setF({ ...f, scoreDirection: v })} />
      <Field label="Image" hint="Facultatif — adresse web ou import depuis votre appareil"><ImageField value={f.img} onChange={(v) => setF({ ...f, img: v })} /></Field>
      <Field label="Présentation & mécaniques"><textarea rows={4} value={f.desc} onChange={(e) => setF({ ...f, desc: e.target.value })} placeholder="Décrivez le jeu, son thème, ses mécaniques..." style={{ ...inputStyle, resize: "vertical" }} /></Field>
      <Field label="Lien Ludum (facultatif)" hint="Collez l'adresse de la fiche du jeu sur Ludum. Laissez vide : un bouton de recherche par nom sera proposé automatiquement.">
        <TextInput value={f.ludumUrl} onChange={(e) => setF({ ...f, ludumUrl: e.target.value })} placeholder="https://www.ludum.fr/..." />
      </Field>

      {/* Bloc : qui possède ce jeu ? (procuration possible) */}
      <Field label="Qui possède ce jeu ?" hint="Vous pouvez créer cette fiche pour vous, pour un autre membre, pour les deux — ou pour personne. Le membre concerné devra confirmer la possession dans Mon espace.">
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr)", gap: 8 }}>
          {[
            { v: "self",  t: "Je le possède",                                d: "Vous êtes inscrit·e comme propriétaire." },
            { v: "other", t: "Un autre membre le possède",                   d: "La fiche sera créée à son nom, à confirmer par sa part." },
            { v: "both",  t: "Plusieurs membres le possèdent (dont moi)",    d: "Vous et d'autres membres êtes propriétaires." },
            { v: "none",  t: "Personne — fiche de référence",               d: "Pour enregistrer des parties jouées sur Board Game Arena, en convention ou chez des joueurs extérieurs. La fiche apparaît grisée et n'est pas comptée dans les jeux de l'association." },
          ].map((opt) => {
            const active = ownership === opt.v;
            return (
              <button key={opt.v} type="button" onClick={() => setOwnership(opt.v)}
                style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "10px 14px", borderRadius: 11, cursor: "pointer", textAlign: "left", border: `2px solid ${active ? C.teal : "#e6dcc9"}`, background: active ? "rgba(30,138,138,.06)" : "#fff" }}>
                <span style={{ width: 18, height: 18, borderRadius: "50%", border: `2px solid ${active ? C.teal : "#c5b69c"}`, marginTop: 1, flexShrink: 0, display: "grid", placeItems: "center" }}>
                  {active && <span style={{ width: 8, height: 8, borderRadius: "50%", background: C.teal }} />}
                </span>
                <span>
                  <span style={{ display: "block", fontFamily: "'Fredoka',sans-serif", fontWeight: 600, color: C.navy, fontSize: 14 }}>{opt.t}</span>
                  <span style={{ display: "block", fontSize: 12, color: "#8a7c6a", marginTop: 2 }}>{opt.d}</span>
                </span>
              </button>
            );
          })}
        </div>
        {(ownership === "other" || ownership === "both") && (
          <div style={{ marginTop: 12, padding: "12px 14px", background: "rgba(232,163,23,.08)", borderRadius: 11 }}>
            <span style={{ display: "block", fontSize: 12.5, color: "#6e6256", marginBottom: 8 }}>Sélectionnez le ou les membres propriétaires :</span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {otherUsers.map((u) => {
                const active = forUserIds.includes(u.id);
                return (
                  <button key={u.id} type="button" onClick={() => toggleForUser(u.id)}
                    style={{ padding: "6px 12px", borderRadius: 999, cursor: "pointer", fontFamily: "'Fredoka',sans-serif", fontWeight: 600, fontSize: 12.5, border: `2px solid ${active ? C.amber : "#e6dcc9"}`, background: active ? C.amber : "#fff", color: active ? "#fff" : "#8a7c6a" }}>
                    {active && <Check size={12} style={{ verticalAlign: "-1px", marginRight: 3 }} />}{u.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </Field>

      {err && <div style={{ background: "rgba(181,40,58,.1)", color: C.red, padding: "10px 14px", borderRadius: 11, fontSize: 13.5, fontWeight: 600, marginBottom: 14 }}>{err}</div>}
      <Btn full size="lg" variant="amber" onClick={submit} disabled={busy}>{busy ? <Loader2 size={18} className="aladj-spin" /> : <><Plus size={18} /> Ajouter le jeu</>}</Btn>
    </div>
  );
}

/* =============================================================================
   PAGE — MA LUDOTHÈQUE (membres connectés) + export Excel
   ============================================================================= */
// Section "Ma famille" : foyer partageant une ludothèque commune
function FamilySection({ setToast }) {
  const { household, users, currentUser, inviteToHousehold, acceptHouseholdInvite, declineHouseholdInvite, cancelHouseholdInvite, leaveHousehold,
    householdGuests, addHouseholdGuest, removeHouseholdGuest, renameHouseholdGuest, askConfirm } = useApp();
  const [guestDraft, setGuestDraft] = useState("");
  const [guestEditId, setGuestEditId] = useState(null);
  const [guestEditName, setGuestEditName] = useState("");
  const [guestBusy, setGuestBusy] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [busy, setBusy] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);

  const nameById = useMemo(() => Object.fromEntries((users || []).map((u) => [u.id, u.name])), [users]);
  const memberIds = household?.memberIds || [];
  const otherMembers = memberIds.filter((id) => id !== currentUser?.id);
  const received = household?.invitesReceived || [];
  const sent = household?.invitesSent || [];
  const sentIds = sent.map((i) => i.invitee_id);
  const inFamily = otherMembers.length > 0;

  const invitable = useMemo(() => (users || [])
    .filter((u) => u.id !== currentUser?.id && !memberIds.includes(u.id) && !sentIds.includes(u.id) && !u.banned)
    .sort((a, b) => a.name.localeCompare(b.name, "fr")), [users, memberIds, sentIds, currentUser]);

  const run = async (fn, ok) => {
    setBusy(true);
    const r = await fn();
    setBusy(false);
    if (r?.error) setToast(r.error);
    else if (ok) setToast(ok);
    return r;
  };

  // On masque entièrement la section s'il n'y a rien à montrer (pas de foyer, aucune invitation)
  if (!currentUser) return null;
  const hasContent = inFamily || received.length > 0 || sent.length > 0;

  return (
    <div style={{ background: "rgba(107,58,122,.06)", border: `2px solid ${C.purple}`, borderRadius: 16, padding: "16px 20px", marginBottom: 22 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: hasContent ? 12 : 6, flexWrap: "wrap" }}>
        <h3 style={{ fontFamily: "'Fredoka',sans-serif", color: C.navy, fontSize: 17, margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
          <Users size={18} color={C.purple} /> Ma famille
        </h3>
        <Btn size="sm" variant="soft" onClick={() => setShowPicker(true)}><UserPlus size={15} /> Inviter un membre</Btn>
      </div>

      <p style={{ fontSize: 12.5, color: "#6e6256", margin: "0 0 12px", lineHeight: 1.5 }}>
        Les membres d'une même famille partagent une ludothèque commune : tous les jeux du foyer apparaissent ici et évoluent ensemble. Chacun garde ses propres notes et avis.
      </p>

      {received.map((i) => (
        <div key={i.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 11, background: "#fff", border: `1px solid ${C.purple}`, marginBottom: 8, flexWrap: "wrap" }}>
          <Mail size={16} color={C.purple} />
          <span style={{ flex: 1, minWidth: 140, fontSize: 13.5, color: "#5e5346" }}>
            <strong>{nameById[i.inviter_id] || "Un membre"}</strong> vous invite à rejoindre sa famille
          </span>
          <Btn size="sm" variant="teal" disabled={busy} onClick={() => run(() => acceptHouseholdInvite(i.id), "Vous avez rejoint la famille.")}><Check size={15} /> Accepter</Btn>
          <Btn size="sm" variant="soft" disabled={busy} onClick={() => run(() => declineHouseholdInvite(i.id))}><X size={15} /> Refuser</Btn>
        </div>
      ))}

      {memberIds.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: (sent.length || inFamily) ? 12 : 0 }}>
          {memberIds.map((id) => (
            <span key={id} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#fff", border: "1px solid #e6dcc9", borderRadius: 999, padding: "5px 12px", fontSize: 13, fontWeight: 600, color: C.navy, fontFamily: "'Fredoka',sans-serif" }}>
              <Users size={13} color={C.purple} /> {id === currentUser?.id ? "Vous" : (nameById[id] || "Membre")}
            </span>
          ))}
        </div>
      )}

      {sent.map((i) => (
        <div key={i.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 14px", borderRadius: 11, background: "rgba(255,255,255,.6)", border: "1px dashed #cdbfa8", marginBottom: 8 }}>
          <Clock size={15} color="#a89a86" />
          <span style={{ flex: 1, minWidth: 0, fontSize: 13, color: "#6e6256" }}>
            Invitation envoyée à <strong>{nameById[i.invitee_id] || "un membre"}</strong> — en attente
          </span>
          <Btn size="sm" variant="ghost" disabled={busy} onClick={() => run(() => cancelHouseholdInvite(i.id))}><X size={14} /> Annuler</Btn>
        </div>
      ))}

      {inFamily && (confirmLeave ? (
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginTop: 4 }}>
          <span style={{ fontSize: 13, color: C.red, fontWeight: 600 }}>Quitter la famille ? Vos jeux redeviendront les vôtres uniquement.</span>
          <Btn size="sm" variant="red" disabled={busy} onClick={async () => { await run(() => leaveHousehold(), "Vous avez quitté la famille."); setConfirmLeave(false); }}><LogOut size={14} /> Confirmer</Btn>
          <Btn size="sm" variant="ghost" disabled={busy} onClick={() => setConfirmLeave(false)}>Annuler</Btn>
        </div>
      ) : (
        <Btn size="sm" variant="ghost" onClick={() => setConfirmLeave(true)}><LogOut size={14} /> Quitter la famille</Btn>
      ))}

      {/* Carnet d'invités : les habitués qu'on retrouve autour de la table.
          Partagé par tout le foyer, sans statistiques ni compte associé. */}
      <div style={{ borderTop: "1px solid #f0e8d8", marginTop: 20, paddingTop: 18 }}>
        <h4 style={{ fontFamily: "'Fredoka',sans-serif", color: C.navy, fontSize: 15.5, margin: "0 0 4px", display: "flex", alignItems: "center", gap: 7 }}>
          <Users size={16} color={C.purple} /> Nos invités réguliers
          {householdGuests.length > 0 && (
            <span style={{ fontSize: 12, fontWeight: 700, color: "#fff", background: C.purple, borderRadius: 999, padding: "1px 8px" }}>{householdGuests.length}</span>
          )}
        </h4>
        <p style={{ margin: "0 0 12px", fontSize: 13, color: "#8a7c6a", lineHeight: 1.55 }}>
          Les amis qui jouent souvent avec vous. Une fois enregistrés ici, ils sont proposés d'un clic
          quand vous enregistrez une partie ou lancez un chronomètre — plus besoin de retaper leur nom.
          {memberIds.length > 1 ? " Ce carnet est commun à toute la famille." : ""}
          <span style={{ display: "block", marginTop: 4, color: "#9c8d79" }}>
            Ce ne sont que des noms : aucune statistique ne leur est rattachée. Pour cela, mieux vaut devenir membre du site.
          </span>
        </p>

        {householdGuests.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr)", gap: 7, marginBottom: 12 }}>
            {householdGuests.map((g) => (
              <div key={g.id} style={{ display: "flex", alignItems: "center", gap: 10, background: "#fff", border: "1px solid #ece2d0", borderRadius: 12, padding: "8px 12px", minWidth: 0 }}>
                {guestEditId === g.id ? (
                  <>
                    <input value={guestEditName} autoFocus onChange={(e) => setGuestEditName(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); document.getElementById("gsave-" + g.id)?.click(); } }}
                      style={{ flex: 1, minWidth: 0, padding: "7px 10px", borderRadius: 9, border: "1.5px solid #e6dcc9", fontFamily: "'Nunito',sans-serif", fontSize: 14, color: C.navy }} />
                    <Btn id={"gsave-" + g.id} size="sm" variant="teal" disabled={guestBusy || !guestEditName.trim()}
                      onClick={async () => { setGuestBusy(true); const r = await renameHouseholdGuest(g.id, guestEditName); setGuestBusy(false); if (r?.error) setToast(r.error); else setGuestEditId(null); }}>
                      <Check size={14} />
                    </Btn>
                    <Btn size="sm" variant="soft" onClick={() => setGuestEditId(null)}>Annuler</Btn>
                  </>
                ) : (
                  <>
                    <span style={{ width: 32, height: 32, borderRadius: 10, flexShrink: 0, background: `${C.purple}1f`, display: "grid", placeItems: "center", fontFamily: "'Fredoka',sans-serif", fontWeight: 700, color: C.purple, fontSize: 14 }}>
                      {g.name[0].toUpperCase()}
                    </span>
                    <span style={{ flex: 1, minWidth: 0, fontFamily: "'Fredoka',sans-serif", fontWeight: 600, color: C.navy, fontSize: 14.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{g.name}</span>
                    <button onClick={() => { setGuestEditId(g.id); setGuestEditName(g.name); }} title="Renommer"
                      style={{ background: "none", border: "none", cursor: "pointer", color: "#9c8d79", padding: 0, flexShrink: 0 }}><Edit3 size={15} /></button>
                    <button title="Retirer du carnet" style={{ background: "none", border: "none", cursor: "pointer", color: C.red, padding: 0, flexShrink: 0 }}
                      onClick={async () => {
                        if (!(await askConfirm({ title: `Retirer ${g.name} ?`, message: "Il ne sera plus proposé lors de vos parties. Les parties déjà enregistrées ne changent pas.", confirmLabel: "Retirer" }))) return;
                        const r = await removeHouseholdGuest(g.id); if (r?.error) setToast(r.error);
                      }}><Trash2 size={15} /></button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        <div style={{ display: "flex", gap: 8 }}>
          <input value={guestDraft} onChange={(e) => setGuestDraft(e.target.value)} maxLength={60}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); document.getElementById("gadd")?.click(); } }}
            placeholder="Prénom d'un invité régulier" style={{ flex: 1, minWidth: 0, padding: "9px 11px", borderRadius: 10, border: "1.5px solid #e6dcc9", fontFamily: "'Nunito',sans-serif", fontSize: 14, background: "#fff", color: C.navy }} />
          <Btn id="gadd" variant="soft" disabled={guestBusy || !guestDraft.trim()}
            onClick={async () => { setGuestBusy(true); const r = await addHouseholdGuest(guestDraft); setGuestBusy(false); if (r?.error) setToast(r.error); else setGuestDraft(""); }}>
            <Plus size={15} /> Ajouter
          </Btn>
        </div>
      </div>

      {showPicker && (
        <Modal open onClose={() => setShowPicker(false)} title="Inviter un membre dans la famille" width={460}>
          {invitable.length === 0 ? (
            <p style={{ color: "#6e6256", fontSize: 14, margin: 0 }}>Aucun membre disponible à inviter pour le moment.</p>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr)", gap: 6, maxHeight: 380, overflowY: "auto" }}>
              {invitable.map((m) => (
                <button key={m.id} disabled={busy} onClick={async () => { const r = await run(() => inviteToHousehold(m.id), "Invitation envoyée."); if (!r?.error) setShowPicker(false); }}
                  style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 11, border: "1px solid #e6dcc9", background: "#fff", cursor: "pointer", textAlign: "left", fontFamily: "'Fredoka',sans-serif", fontWeight: 600, color: C.navy, fontSize: 14 }}>
                  <UserPlus size={16} color={C.purple} /> {m.name}
                </button>
              ))}
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}

function EventPlaySuggestions() {
  const { eventPlaySuggestions, confirmEventPlay, dismissEventPlay, myPendingPlays, confirmPlayParticipation, declinePlayParticipation, games, users, currentUser } = useApp();
  const [busy, setBusy] = useState(null);
  const [wonSet, setWonSet] = useState({});
  const total = eventPlaySuggestions.length + (myPendingPlays || []).length;
  if (!total) return null;
  const keyOf = (s) => s.eventId + "|" + s.gameId + "|" + s.occurrence;
  return (
    <div style={{ marginBottom: 22 }}>
      <h3 style={{ fontFamily: "'Fredoka',sans-serif", color: C.navy, fontSize: 17, margin: "0 0 6px", display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 20 }}>📋</span> Parties à confirmer
        <span style={{ background: C.red, color: "#fff", borderRadius: 999, fontSize: 12, padding: "1px 9px", fontWeight: 700 }}>{total}</span>
      </h3>
      <p style={{ margin: "0 0 12px", fontSize: 13, color: "#6e6256" }}>Confirme les parties qui te concernent pour les ajouter à tes statistiques.</p>
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr)", gap: 8 }}>
        {(myPendingPlays || []).map((pl) => {
          const k = "play|" + pl.id;
          // Le statut de vainqueur declare par celui qui a saisi la partie sert
          // de valeur par defaut : sans cela, un gagnant devait se re-declarer
          // lui-meme et beaucoup de victoires se perdaient en chemin.
          const myPart = (pl.participants || []).find((pt) => pt.userId === currentUser?.id);
          const declaredWin = !!(myPart && myPart.isWinner);
          const won = k in wonSet ? wonSet[k] : declaredWin;
          const isBusy = busy === k;
          const gName = (games || []).find((g) => g.id === pl.gameId)?.name || "Jeu";
          const recorder = (users || []).find((u) => u.id === pl.recordedBy)?.name || "Un membre";
          return (
            <div key={k} style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", background: "#fff", border: "1px solid #ece2d0", borderRadius: 12, padding: "10px 13px" }}>
              <div style={{ flex: 1, minWidth: 150 }}>
                <div style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 700, color: C.navy, fontSize: 15 }}>{gName}</div>
                <div style={{ fontSize: 12.5, color: "#9c8d79" }}>
                  Partie du {new Date(pl.playedAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })} · enregistrée par {recorder}
                  {declaredWin && <span style={{ color: C.amber, fontWeight: 700 }}> · vous êtes déclaré vainqueur</span>}
                  {myPart && myPart.score != null && myPart.score !== "" && <span> · {myPart.score} pts</span>}
                </div>
              </div>
              <label style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 13, fontWeight: won ? 700 : 400, color: won ? "#8a6a1f" : "#6b5d49", cursor: "pointer" }}>
                <input type="checkbox" checked={won} onChange={() => setWonSet((p) => ({ ...p, [k]: !won }))} /> j'ai gagné
              </label>
              <div style={{ display: "flex", gap: 6 }}>
                <Btn size="sm" variant="teal" disabled={isBusy} onClick={async () => { setBusy(k); await confirmPlayParticipation(pl.id, won); setBusy(null); }}>J'y ai joué</Btn>
                <Btn size="sm" variant="ghost" disabled={isBusy} onClick={async () => { setBusy(k); await declinePlayParticipation(pl.id); setBusy(null); }}>Non</Btn>
              </div>
            </div>
          );
        })}
        {eventPlaySuggestions.map((s) => {
          const k = keyOf(s);
          const won = !!wonSet[k];
          const isBusy = busy === k;
          return (
            <div key={k} style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", background: "#fff", border: "1px solid #ece2d0", borderRadius: 12, padding: "10px 13px" }}>
              <div style={{ flex: 1, minWidth: 150 }}>
                <div style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 700, color: C.navy, fontSize: 15 }}>{s.gameName}{s.occurrenceTotal > 1 ? <span style={{ color: C.teal, fontSize: 13 }}> — partie {s.occurrence}/{s.occurrenceTotal}</span> : null}</div>
                <div style={{ fontSize: 12.5, color: "#9c8d79" }}>Soirée du {new Date(s.date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}{s.place ? " · " + s.place : ""}</div>
              </div>
              <label style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 13, color: "#6b5d49", cursor: "pointer" }}>
                <input type="checkbox" checked={won} onChange={() => setWonSet((p) => ({ ...p, [k]: !won }))} /> j'ai gagné
              </label>
              <div style={{ display: "flex", gap: 6 }}>
                <Btn size="sm" variant="teal" disabled={isBusy} onClick={async () => { setBusy(k); await confirmEventPlay(s.eventId, s.gameId, s.occurrence, won); setBusy(null); }}>J'y ai joué</Btn>
                <Btn size="sm" variant="ghost" disabled={isBusy} onClick={async () => { setBusy(k); await dismissEventPlay(s.eventId, s.gameId, s.occurrence); setBusy(null); }}>Non</Btn>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* =============================================================================
   BADGES — affichage
   ============================================================================= */
// Médaille d'un badge : pastille colorée selon le palier, emoji au centre.
function BadgeMedal({ def, tier, size = 54, grayed = false }) {
  const color = tier > 0 ? TIER_COLORS[tier - 1] : "#d8cdb9";
  return (
    <span style={{ position: "relative", width: size, height: size, borderRadius: "50%", display: "grid", placeItems: "center", flexShrink: 0,
      background: grayed ? "#f1ebdd" : `${color}22`, border: `3px solid ${grayed ? "#ddd2bd" : color}`, filter: grayed ? "grayscale(.9)" : "none" }}>
      <span style={{ fontSize: size * 0.45, lineHeight: 1 }}>{def.emoji}</span>
      {tier > 0 && (
        <span style={{ position: "absolute", bottom: -7, left: "50%", transform: "translateX(-50%)", background: color, color: "#fff",
          borderRadius: 999, fontSize: size * 0.19, fontWeight: 700, fontFamily: "'Fredoka',sans-serif", padding: "1px 7px", whiteSpace: "nowrap", border: "2px solid #FBF7EF" }}>
          {TIER_NAMES[tier - 1]}
        </span>
      )}
    </span>
  );
}

// Détail d'un badge : les 8 paliers avec leur dénomination, la progression, la mise en avant.
function BadgeDetailModal({ b, onClose, canFeature, isFeatured, featureFull, onToggleFeature }) {
  const { def, count, tier, next } = b;
  return (
    <Modal open onClose={onClose} title={`${def.emoji} ${def.label}`} width={480}>
      <p style={{ fontSize: 14, color: "#6e6256", margin: "0 0 6px" }}>
        {tier > 0
          ? <>Niveau actuel : <b style={{ color: TIER_COLORS[tier - 1] }}>{TIER_NAMES[tier - 1]}</b> — {count} {def.unit}{def.dynamic ? " (badge évolutif : il peut se perdre !)" : ""}.</>
          : <>Pas encore obtenu — {count} {def.unit}.</>}
      </p>
      {next != null && <p style={{ fontSize: 13, color: "#9c8d79", margin: "0 0 14px" }}>Prochain palier : {next} ({count}/{next}).</p>}
      {next == null && <p style={{ fontSize: 13, color: C.amber, fontWeight: 700, margin: "0 0 14px" }}>Palier maximal atteint. Respect. 🙇</p>}
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr)", gap: 6, marginBottom: 16 }}>
        {def.thresholds.map((t, i) => {
          const reached = tier >= i + 1;
          const current = tier === i + 1;
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 10,
              background: reached ? `${TIER_COLORS[i]}18` : "#fff", border: `1.5px solid ${current ? TIER_COLORS[i] : "#ece2d0"}`, opacity: reached ? 1 : .65 }}>
              <span style={{ width: 26, height: 26, borderRadius: "50%", background: reached ? TIER_COLORS[i] : "#e4dac6", color: "#fff", display: "grid", placeItems: "center", fontSize: 12.5, fontWeight: 700, fontFamily: "'Fredoka',sans-serif", flexShrink: 0 }}>{i + 1}</span>
              <span style={{ flex: 1, fontFamily: "'Fredoka',sans-serif", fontWeight: 600, color: C.navy, fontSize: 14 }}>{TIER_NAMES[i]}</span>
              <span style={{ fontSize: 13, color: "#8a7c6a" }}>{t} {def.unit}</span>
              {reached && <Check size={15} color={TIER_COLORS[i]} />}
            </div>
          );
        })}
      </div>
      {canFeature && tier > 0 && (
        <Btn full variant={isFeatured ? "soft" : "amber"} disabled={!isFeatured && featureFull}
          onClick={() => onToggleFeature(def.key)}>
          {isFeatured ? "Retirer de ma vitrine" : featureFull ? "Vitrine pleine (3 badges max)" : "⭐ Mettre en avant sur ma fiche"}
        </Btn>
      )}
    </Modal>
  );
}

// Section « Mes badges » de Mon espace.
function MyBadgesSection({ setToast }) {
  const { plays, events, games, upcoming, beltByGame, currentUser, updateProfile } = useApp();
  const [openKey, setOpenKey] = useState(null);
  const myBadges = useMemo(
    () => (currentUser ? badgesFor(currentUser.id, { plays, events, games, upcoming, beltByGame }) : []),
    [plays, events, games, upcoming, beltByGame, currentUser]
  );
  if (!currentUser) return null;
  const featured = currentUser.featuredBadges || [];
  const earnedCount = myBadges.filter((b) => b.tier > 0).length;
  const opened = openKey ? myBadges.find((b) => b.def.key === openKey) : null;
  const toggleFeature = async (key) => {
    const arr = featured.includes(key) ? featured.filter((k) => k !== key) : [...featured, key].slice(0, 3);
    await updateProfile({ featuredBadges: arr });
    setToast(featured.includes(key) ? "Badge retiré de votre vitrine." : "Badge mis en avant sur votre fiche !");
  };
  return (
    <div style={{ marginBottom: 22 }}>
      <h3 style={{ fontFamily: "'Fredoka',sans-serif", color: C.navy, fontSize: 17, margin: "0 0 6px", display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 20 }}>🎖️</span> Mes badges
        <span style={{ fontSize: 12.5, color: "#9c8d79", fontWeight: 400, fontFamily: "'Nunito',sans-serif" }}>{earnedCount}/{BADGE_DEFS.length} obtenus</span>
      </h3>
      <p style={{ margin: "0 0 12px", fontSize: 13, color: "#6e6256" }}>Cliquez sur un badge pour voir ses paliers. Mettez jusqu'à 3 badges en vitrine : ils apparaîtront à côté de votre nom.</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(108px, 1fr))", gap: 10 }}>
        {myBadges.map((b) => (
          <button key={b.def.key} type="button" onClick={() => setOpenKey(b.def.key)}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: "14px 8px 10px", background: "#fff", border: "1px solid #ece2d0", borderRadius: 14, cursor: "pointer", position: "relative" }}>
            {featured.includes(b.def.key) && b.tier > 0 && <span style={{ position: "absolute", top: 5, right: 7, fontSize: 13 }} title="En vitrine">⭐</span>}
            <BadgeMedal def={b.def} tier={b.tier} grayed={b.tier === 0} />
            <span style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 600, fontSize: 12, color: b.tier > 0 ? C.navy : "#a89a86", textAlign: "center", lineHeight: 1.2 }}>{b.def.label}</span>
            <span style={{ fontSize: 10.5, color: "#9c8d79" }}>{b.next != null ? `${b.count}/${b.next}` : b.count}</span>
          </button>
        ))}
      </div>
      {opened && (
        <BadgeDetailModal b={opened} onClose={() => setOpenKey(null)} canFeature
          isFeatured={featured.includes(opened.def.key)} featureFull={featured.length >= 3}
          onToggleFeature={(k) => toggleFeature(k)} />
      )}
    </div>
  );
}

/* ---- Sauvegarde admin : télécharge toutes les données en JSON ----
   Filet de sécurité en cas de fausse manipulation : un fichier daté, à conserver
   (le ré-import se ferait via l'éditeur SQL si besoin).

   La liste ci-dessous couvre L'INTÉGRALITÉ des tables du schéma public. Ne sont
   volontairement pas incluses :
     • les vues (v_game_play_durations, v_game_phase_time…) — elles se
       recalculent toutes seules à partir des tables ;
     • les images — elles vivent sur Cloudflare R2, en dehors de la base, et ne
       risquent donc rien lors d'une manipulation SQL.

   Chaque table est accompagnée d'une CASCADE de colonnes de tri : on essaie le
   premier jeu, et si la requête échoue (colonne absente), on passe au suivant,
   puis sans tri du tout. Une table dont le schéma évolue ne peut donc pas faire
   échouer silencieusement la sauvegarde. ---- */
const BACKUP_TABLES = [
  // Membres, foyers
  ["profiles", [["id"]]],
  ["households", [["id"]]],
  ["household_members", [["id"], ["household_id"]]],
  ["household_invites", [["id"], ["created_at"]]],
  // Ludothèque
  ["games", [["id"]]],
  ["game_owners", [["game_id", "owner_id"]]],
  ["extensions", [["id"]]],
  ["extension_owners", [["id"]]],
  ["ratings", [["game_id", "user_id"]]],
  ["game_weights", [["game_id", "owner_id"]]],
  ["game_discoveries", [["game_id", "user_id"]]],
  ["game_comments", [["created_at", "id"]]],
  ["game_rules", [["created_at", "id"]]],
  ["loans", [["id"], ["created_at"]]],
  ["mechanic_suggestions", [["id"], ["name"]]],
  // Moments jeux
  ["events", [["id"]]],
  ["event_players", [["event_id", "user_id"]]],
  ["event_guests", [["id"], ["event_id"]]],
  ["event_games", [["id"]]],
  ["event_comments", [["created_at", "id"]]],
  ["event_play_dismissed", [["id"], ["created_at"]]],
  ["places", [["id"]]],
  // Veille
  ["upcoming_games", [["id"]]],
  ["upcoming_comments", [["created_at", "id"]]],
  ["upcoming_hype", [["id"], ["game_id"]]],
  ["upcoming_intent", [["id"], ["game_id"]]],
  // Parties enregistrées et scores
  ["game_plays", [["played_at", "id"]]],
  ["game_play_participants", [["id"]]],
  // Chronomètre
  ["play_sessions", [["id"]]],
  ["play_session_players", [["id"]]],
  ["play_session_games", [["id"]]],
  ["play_turns", [["id"]]],
  // Espace decisionnaire
  ["decider_ideas", [["created_at", "id"]]],
  ["decider_idea_comments", [["created_at", "id"]]],
  ["decider_idea_supports", [["idea_id", "user_id"]]],
  ["polls", [["created_at", "id"]]],
  ["poll_options", [["id"]]],
  ["poll_votes", [["id"]]],
  ["poll_comments", [["created_at", "id"]]],
  // Divers
  ["notifications", [["id"], ["created_at"]]],
  ["push_subscriptions", [["id"], ["created_at"]]],
  ["reco_dismissed", [["id"], ["created_at"]]],
];

/* Requête de secours, à coller dans l'éditeur SQL de Supabase, utilisée
   uniquement si la fonction admin_table_counts() n'est pas encore déployée.
   100 % ASCII. */
const BACKUP_CHECK_SQL = "SELECT table_name,\n" +
  "       (xpath('/row/cnt/text()',\n" +
  "        query_to_xml('SELECT count(*) AS cnt FROM public.'||quote_ident(table_name),\n" +
  "        false, true, '')))[1]::text::int AS nb_lignes\n" +
  "FROM information_schema.tables\n" +
  "WHERE table_schema = 'public' AND table_type = 'BASE TABLE'\n" +
  "ORDER BY 1;";

/* Rapatrie une table entière par lecture directe. ATTENTION : cette voie est
   soumise aux policies RLS — elle sert uniquement de repli si la fonction
   admin_backup_table() n'est pas disponible. Elle essaie successivement chaque
   jeu de colonnes de tri, puis sans tri. Pagination par lots de 1000. */
async function backupFetchTable(table, orderSets) {
  const size = 1000;
  const sets = [...(orderSets || []), []];
  let lastErr = null;
  for (let s = 0; s < sets.length; s++) {
    const cols = sets[s];
    const all = [];
    let ok = true;
    let from = 0;
    for (let guard = 0; guard < 200; guard++) {
      let q = supabase.from(table).select("*");
      cols.forEach((c) => { q = q.order(c, { ascending: true }); });
      const { data, error } = await q.range(from, from + size - 1);
      if (error) { lastErr = error; ok = false; break; }
      if (!data || data.length === 0) break;
      all.push(...data);
      if (data.length < size) break;
      from += size;
    }
    if (ok) return { rows: all, error: null };
  }
  return { rows: [], error: (lastErr && lastErr.message) || "erreur inconnue" };
}

function AdminBackupSection() {
  const { currentUser } = useApp();
  const [busy, setBusy] = useState(false);
  const [prog, setProg] = useState("");
  const [report, setReport] = useState(null);
  const [copied, setCopied] = useState(false);
  if (!currentUser?.admin) return null;

  const download = async () => {
    setBusy(true); setReport(null);
    setProg("inventaire…");

    /* 1) Comptes réels de chaque table, hors RLS. Sert à la fois de référence de
       contrôle ET de liste des tables : une table ajoutée plus tard au schéma
       sera donc sauvegardée automatiquement, sans toucher au code. */
    let counts = null;
    try {
      const { data, error } = await supabase.rpc("admin_table_counts");
      if (!error && data && typeof data === "object") counts = data;
    } catch (e) { /* fonction non déployée : on continue sans référence */ }

    /* 2) Plan de sauvegarde : les tables connues (avec leur tri éprouvé, utile
       seulement pour le repli), puis toute table supplémentaire vue en base. */
    const known = BACKUP_TABLES.map((x) => x[0]);
    const extra = counts ? Object.keys(counts).filter((t) => !known.includes(t)).sort() : [];
    const plan = [...BACKUP_TABLES, ...extra.map((t) => [t, [["id"], ["created_at"]]])];

    const out = {}; const errors = []; const summary = [];
    for (let i = 0; i < plan.length; i++) {
      const [t, orderSets] = plan[i];
      setProg(`${i + 1}/${plan.length} — ${t}`);
      let rows = null; let via = null; let err = null;

      // a) Voie administrateur : contenu intégral, insensible aux RLS.
      try {
        const { data, error } = await supabase.rpc("admin_backup_table", { p_table: t });
        if (!error && Array.isArray(data)) { rows = data; via = "admin"; }
        else if (error) err = error.message;
      } catch (e) { err = String((e && e.message) || e); }

      // b) Repli : lecture directe, soumise aux RLS (peut être incomplète).
      if (rows === null) {
        try {
          const r = await backupFetchTable(t, orderSets);
          if (r.error) { err = r.error; } else { rows = r.rows; via = "direct"; err = null; }
        } catch (e) { err = String((e && e.message) || e); }
      }

      const expected = counts && counts[t] != null ? Number(counts[t]) : null;
      if (rows === null) {
        errors.push(t);
        summary.push({ table: t, rows: 0, expected, via: null, error: err || "échec" });
      } else {
        out[t] = rows;
        summary.push({ table: t, rows: rows.length, expected, via, error: null });
      }
    }

    const total = summary.reduce((s, r) => s + r.rows, 0);
    const expectedTotal = summary.reduce((s, r) => s + (r.expected || 0), 0);
    const partial = summary.filter((r) => !r.error && r.expected != null && r.rows < r.expected);
    const payload = {
      site: "aladj.fr",
      exportedAt: new Date().toISOString(),
      tableCount: plan.length,
      rowCount: total,
      expectedRowCount: counts ? expectedTotal : null,
      complete: Boolean(counts) && errors.length === 0 && partial.length === 0,
      note: "Images non incluses : elles sont stockees sur Cloudflare R2, hors base.",
      summary, errors, tables: out,
    };
    const blob = new Blob([JSON.stringify(payload)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `aladj-sauvegarde-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    setBusy(false); setProg("");
    setReport({ summary, errors, total, expectedTotal, partial, hasCounts: Boolean(counts) });
  };

  const copySql = async () => {
    try {
      await navigator.clipboard.writeText(BACKUP_CHECK_SQL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) { /* presse-papier indisponible : rien de grave */ }
  };

  /* Statut d'une ligne du rapport : vert = conforme au nombre réel en base,
     rouge = échec ou lecture incomplète, ambre = pas de référence disponible. */
  const rowState = (r) => {
    if (r.error) return "err";
    if (r.expected == null) return r.rows === 0 ? "warn" : "unknown";
    return r.rows < r.expected ? "err" : "ok";
  };
  const STATE_COLORS = { ok: C.teal, err: C.red, warn: C.amber, unknown: "#8a7a63" };
  const STATE_BORDERS = { ok: "#d8e8e4", err: "#f0cdd3", warn: "#f2e2bd", unknown: "#e7e0d2" };

  return (
    <div style={{ background: C.paper, borderRadius: 20, padding: 22, border: "1px solid #ece2d0", marginBottom: 22 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <ShieldCheck size={19} color={C.purple} />
        <h3 style={{ fontFamily: "'Fredoka',sans-serif", fontSize: 17, margin: 0, color: C.navy }}>Sauvegarde des données (admin)</h3>
      </div>
      <p style={{ fontSize: 13.5, color: "#6e6256", lineHeight: 1.5, margin: "0 0 12px" }}>
        Télécharge une copie de <b>toutes les tables du site</b> (membres, jeux, notes, prêts, foyers, moments,
        veille, parties et scores, chronomètre, notifications…) dans un fichier daté. Le contenu est ensuite
        <b> vérifié table par table</b> contre le nombre de lignes réel en base. Les <b>images</b> ne sont pas
        concernées : elles sont stockées à part et ne risquent rien lors d'une manipulation en base.
        À faire régulièrement, et systématiquement avant toute opération sensible.
      </p>
      <Btn variant="soft" disabled={busy} onClick={download}>
        {busy ? <><Loader2 size={15} className="aladj-spin" /> {prog}</> : <>💾 Télécharger une sauvegarde (JSON)</>}
      </Btn>

      {report && (
        <div style={{ marginTop: 18, borderTop: "1px solid #ece2d0", paddingTop: 14 }}>
          {(() => {
            const ko = report.errors.length + report.partial.length;
            if (!report.hasCounts) return (
              <div style={{ display: "flex", alignItems: "flex-start", gap: 7, fontSize: 13.5, color: C.amber, fontWeight: 700, marginBottom: 8 }}>
                <AlertTriangle size={16} color={C.amber} style={{ flexShrink: 0, marginTop: 1 }} />
                <span>Vérification impossible : la fonction de contrôle n'est pas installée en base. Les nombres ci-dessous peuvent être incomplets.</span>
              </div>
            );
            if (ko === 0) return (
              <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 14, fontWeight: 700, color: C.navy, marginBottom: 8 }}>
                <Check size={16} color={C.teal} />
                Sauvegarde complète — {report.summary.length} tables, {report.total.toLocaleString("fr-FR")} lignes, conforme à la base.
              </div>
            );
            return (
              <div style={{ display: "flex", alignItems: "flex-start", gap: 7, fontSize: 14, fontWeight: 700, color: C.red, marginBottom: 8 }}>
                <AlertTriangle size={16} color={C.red} style={{ flexShrink: 0, marginTop: 1 }} />
                <span>
                  Sauvegarde incomplète : {(report.expectedTotal - report.total).toLocaleString("fr-FR")} ligne(s)
                  manquante(s) sur {ko} table(s). Le fichier a bien été téléchargé, mais ne vous y fiez pas tel quel.
                </span>
              </div>
            );
          })()}

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(178px,1fr))", gap: 5, marginBottom: 12 }}>
            {report.summary.map((r) => {
              const st = rowState(r);
              return (
                <div key={r.table} title={r.error || (r.expected != null ? `${r.rows} / ${r.expected} en base` : "")} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6, minWidth: 0,
                  background: "#fff", border: `1px solid ${STATE_BORDERS[st]}`,
                  borderRadius: 9, padding: "5px 9px", fontSize: 12.5,
                }}>
                  <span style={{ color: "#5e5346", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.table}</span>
                  <b style={{ color: STATE_COLORS[st], whiteSpace: "nowrap" }}>
                    {r.error ? "échec" : (st === "err" ? `${r.rows.toLocaleString("fr-FR")}/${r.expected.toLocaleString("fr-FR")}` : r.rows.toLocaleString("fr-FR"))}
                  </b>
                </div>
              );
            })}
          </div>

          {!report.hasCounts && (
            <>
              <Btn variant="ghost" size="sm" onClick={copySql}>
                {copied ? <><Check size={14} /> Requête copiée</> : <><Copy size={14} /> Copier la requête de vérification</>}
              </Btn>
              <p style={{ fontSize: 12, color: "#8a7a63", margin: "8px 0 0", lineHeight: 1.5 }}>
                À coller dans l'éditeur SQL de Supabase : elle affiche le nombre de lignes réel de chaque table,
                à comparer avec les nombres ci-dessus.
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}

/* =============================================================================
   ADMIN — Gestion des mécaniques de jeu.
   La liste des suggestions vit dans la table mechanic_suggestions. Renommer ou
   fusionner passe par la fonction SQL admin_rename_mechanic, qui met à jour
   toutes les fiches (ludothèque, veille, mécaniques préférées des profils) et
   mémorise l'ancien nom comme alias pour les futurs imports BoardGameGeek.
   ============================================================================= */
function AdminMechanicsSection({ setToast }) {
  const { currentUser, games, upcoming, users, reload } = useApp();
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState(null); // lignes de mechanic_suggestions (null = pas encore chargé)
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");
  const [newName, setNewName] = useState("");
  const [action, setAction] = useState(null); // { type: "rename" | "merge" | "delete", name }
  const [renameVal, setRenameVal] = useState("");
  const [mergeTarget, setMergeTarget] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setErr("");
    let { data, error } = await supabase.from("mechanic_suggestions").select("name,aliases").order("name");
    if (!error && (!data || data.length === 0)) {
      // Première utilisation : on initialise la table avec la liste par défaut du code.
      await supabase.from("mechanic_suggestions").upsert(
        DEFAULT_MECHANIC_SUGGESTIONS.map((name) => ({ name })),
        { onConflict: "name", ignoreDuplicates: true }
      );
      ({ data, error } = await supabase.from("mechanic_suggestions").select("name,aliases").order("name"));
    }
    if (error) setErr("Impossible de charger la liste — la table mechanic_suggestions existe-t-elle ? (script SQL à exécuter au préalable)");
    setRows(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { if (open && rows === null) load(); }, [open, rows, load]);

  // Usage de chaque mécanique : ludothèque, veille, mécaniques préférées des profils
  const usage = useMemo(() => {
    const u = {};
    const bump = (m, key) => { const e = (u[m] ||= { games: 0, upcoming: 0, profiles: 0 }); e[key]++; };
    (games || []).forEach((g) => (g.mechanics || []).forEach((m) => bump(m, "games")));
    (upcoming || []).forEach((g) => (g.mechanics || []).forEach((m) => bump(m, "upcoming")));
    (users || []).forEach((p) => (p.favMechanics || []).forEach((m) => bump(m, "profiles")));
    return u;
  }, [games, upcoming, users]);

  const inList = useMemo(() => new Set((rows || []).map((r) => r.name)), [rows]);
  const allNames = useMemo(() => {
    const s = new Set([...(rows || []).map((r) => r.name), ...Object.keys(usage)]);
    return [...s].sort((a, b) => a.localeCompare(b, "fr"));
  }, [rows, usage]);
  const shown = allNames.filter((m) => !q.trim() || m.toLowerCase().includes(q.trim().toLowerCase()));

  if (!currentUser?.admin) return null;

  const totalUse = (m) => { const e = usage[m]; return e ? e.games + e.upcoming : 0; };
  const useLabel = (m) => {
    const e = usage[m] || { games: 0, upcoming: 0, profiles: 0 };
    const parts = [];
    if (e.games) parts.push(`${e.games} jeu${e.games > 1 ? "x" : ""}`);
    if (e.upcoming) parts.push(`${e.upcoming} en veille`);
    if (e.profiles) parts.push(`${e.profiles} profil${e.profiles > 1 ? "s" : ""}`);
    return parts.length ? parts.join(" · ") : "non utilisée";
  };
  const plur = (n) => (n > 1 ? "s" : "");

  const afterChange = async (msg) => {
    setAction(null); setBusy(false); setNewName("");
    await load();      // recharge la liste locale du panneau
    await reload();    // recharge jeux / profils + suggestions et alias globaux
    setToast(msg);
  };

  const doAdd = async (name) => {
    const v = (name ?? newName).trim();
    if (!v) return;
    setBusy(true); setErr("");
    const { error } = await supabase.from("mechanic_suggestions").upsert([{ name: v }], { onConflict: "name", ignoreDuplicates: true });
    if (error) { setErr(error.message); setBusy(false); return; }
    await afterChange(`Mécanique « ${v} » ajoutée aux suggestions.`);
  };

  const runRename = async (from, to, isMerge) => {
    setBusy(true); setErr("");
    const { data, error } = await supabase.rpc("admin_rename_mechanic", { old_name: from, new_name: to });
    if (error) { setErr(error.message); setBusy(false); return; }
    const n = (data?.games || 0) + (data?.upcoming || 0);
    await afterChange(isMerge
      ? `« ${from} » fusionnée dans « ${to} » — ${n} fiche${plur(n)} mise${plur(n)} à jour.`
      : `« ${from} » renommée en « ${to} » — ${n} fiche${plur(n)} mise${plur(n)} à jour.`);
  };

  const doDelete = async (m, everywhere) => {
    setBusy(true); setErr("");
    const { data, error } = await supabase.rpc("admin_delete_mechanic", { target: m, everywhere });
    if (error) { setErr(error.message); setBusy(false); return; }
    if (everywhere) {
      const n = (data?.games || 0) + (data?.upcoming || 0);
      await afterChange(`« ${m} » supprimée partout — ${n} fiche${plur(n)} mise${plur(n)} à jour.`);
    } else {
      await afterChange(`« ${m} » retirée des suggestions (les fiches qui l'utilisent la conservent).`);
    }
  };

  const iconBtn = (title, color, onClick, Icon) => (
    <button type="button" title={title} disabled={busy} onClick={onClick} style={{ border: "none", background: "transparent", color, cursor: busy ? "not-allowed" : "pointer", display: "grid", placeItems: "center", padding: 3 }}><Icon size={15} /></button>
  );

  return (
    <div style={{ background: C.paper, borderRadius: 20, padding: 22, border: "1px solid #ece2d0", marginBottom: 22 }}>
      <button type="button" onClick={() => setOpen((o) => !o)} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", border: "none", background: "transparent", cursor: "pointer", padding: 0, textAlign: "left" }}>
        <ShieldCheck size={19} color={C.purple} />
        <h3 style={{ fontFamily: "'Fredoka',sans-serif", fontSize: 17, margin: 0, color: C.navy, flex: 1 }}>Gestion des mécaniques (admin)</h3>
        <ChevronDown size={18} color={C.navy} style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform .2s" }} />
      </button>
      {open && (
        <div style={{ marginTop: 12 }}>
          <p style={{ fontSize: 13.5, color: "#6e6256", lineHeight: 1.5, margin: "0 0 12px" }}>
            Ces mécaniques sont proposées à la création et la modification des fiches jeux. <b>Renommer</b> ou <b>fusionner</b> met à jour <b>toutes</b> les fiches (ludothèque, veille, mécaniques préférées des profils), et l'ancien nom sera converti automatiquement lors des futurs imports BoardGameGeek.
          </p>
          <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 180 }}>
              <TextInput value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Nouvelle mécanique…" onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); doAdd(); } }} />
            </div>
            <Btn variant="teal" disabled={busy || !newName.trim()} onClick={() => doAdd()}><Plus size={15} /> Ajouter</Btn>
          </div>
          <div style={{ marginBottom: 10 }}><TextInput value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filtrer la liste…" /></div>
          {err && <div style={{ background: "rgba(181,40,58,.1)", color: C.red, padding: "9px 13px", borderRadius: 11, fontSize: 13, fontWeight: 600, marginBottom: 10 }}>{err}</div>}
          {loading && <div style={{ textAlign: "center", padding: 14 }}><Loader2 size={20} className="aladj-spin" color={C.teal} /></div>}
          {!loading && rows !== null && (
            <div style={{ maxHeight: 420, overflowY: "auto", border: "1px solid #ece2d0", borderRadius: 14, background: "#fff" }}>
              {shown.length === 0 && <div style={{ padding: 16, fontSize: 13.5, color: "#9c8d79", textAlign: "center" }}>Aucune mécanique ne correspond.</div>}
              {shown.map((m) => {
                const active = action?.name === m ? action.type : null;
                const nUse = totalUse(m);
                return (
                  <div key={m} style={{ borderBottom: "1px solid #f3ecdd", padding: "8px 13px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 600, fontSize: 13.5, color: C.navy }}>{m}</span>
                      {!inList.has(m) && <span title="Utilisée sur des fiches mais absente de la liste de suggestions" style={{ fontSize: 11, fontWeight: 700, borderRadius: 999, padding: "2px 9px", background: "rgba(232,163,23,.15)", color: "#9a6d0a" }}>hors liste</span>}
                      <span style={{ fontSize: 11.5, color: "#9c8d79", flex: 1, minWidth: 80 }}>{useLabel(m)}</span>
                      {!inList.has(m) && iconBtn("Ajouter aux suggestions", C.teal, () => doAdd(m), Plus)}
                      {iconBtn("Renommer (sur toutes les fiches)", C.navy, () => { setErr(""); setRenameVal(m); setAction(active === "rename" ? null : { type: "rename", name: m }); }, Edit3)}
                      {iconBtn("Fusionner dans une autre mécanique", C.purple, () => { setErr(""); setMergeTarget(""); setAction(active === "merge" ? null : { type: "merge", name: m }); }, ArrowRightLeft)}
                      {iconBtn("Supprimer", C.red, () => { setErr(""); setAction(active === "delete" ? null : { type: "delete", name: m }); }, Trash2)}
                    </div>
                    {active === "rename" && (
                      <div style={{ marginTop: 8, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                        <div style={{ flex: 1, minWidth: 160 }}>
                          <TextInput value={renameVal} onChange={(e) => setRenameVal(e.target.value)} autoFocus onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); if (renameVal.trim() && renameVal.trim() !== m) runRename(m, renameVal.trim(), inList.has(renameVal.trim())); } }} />
                        </div>
                        <Btn size="sm" variant="teal" disabled={busy || !renameVal.trim() || renameVal.trim() === m} onClick={() => runRename(m, renameVal.trim(), inList.has(renameVal.trim()))}>
                          {busy ? <Loader2 size={14} className="aladj-spin" /> : <Check size={14} />} Renommer partout
                        </Btn>
                        {inList.has(renameVal.trim()) && renameVal.trim() !== m && (
                          <span style={{ fontSize: 12, color: "#9a6d0a", fontWeight: 600 }}>Ce nom existe déjà : les deux mécaniques seront fusionnées.</span>
                        )}
                      </div>
                    )}
                    {active === "merge" && (
                      <div style={{ marginTop: 8, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                        <select value={mergeTarget} onChange={(e) => setMergeTarget(e.target.value)} style={{ ...inputStyle, flex: 1, minWidth: 160, width: "auto" }}>
                          <option value="">Fusionner dans…</option>
                          {allNames.filter((x) => x !== m).map((x) => <option key={x} value={x}>{x}</option>)}
                        </select>
                        <Btn size="sm" variant="purple" disabled={busy || !mergeTarget} onClick={() => runRename(m, mergeTarget, true)}>
                          {busy ? <Loader2 size={14} className="aladj-spin" /> : <ArrowRightLeft size={14} />} Fusionner
                        </Btn>
                        <span style={{ fontSize: 12, color: "#9c8d79" }}>Toutes les fiches « {m} » passeront sur la mécanique choisie.</span>
                      </div>
                    )}
                    {active === "delete" && (
                      <div style={{ marginTop: 8, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                        {inList.has(m) && <Btn size="sm" variant="soft" disabled={busy} onClick={() => doDelete(m, false)}>Retirer des suggestions</Btn>}
                        {nUse > 0 && <Btn size="sm" variant="danger" disabled={busy} onClick={() => doDelete(m, true)}>{busy ? <Loader2 size={14} className="aladj-spin" /> : <Trash2 size={14} />} Supprimer partout ({nUse} fiche{plur(nUse)})</Btn>}
                        {!inList.has(m) && nUse === 0 && <span style={{ fontSize: 12, color: "#9c8d79" }}>Cette mécanique n'est ni dans la liste ni utilisée — rien à supprimer.</span>}
                        <span style={{ fontSize: 12, color: "#9c8d79" }}>« Retirer » : les fiches existantes la conservent. « Partout » : elle est retirée de toutes les fiches et des profils.</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* =============================================================================
   COTISATION — statut de membre décisionnaire (365 jours, cumulables).
   Paiement en ligne (Stripe : CB, Apple Pay, Google Pay, PayPal) ou
   engagement à régler en espèces auprès du bureau. Aucun autre moyen accepté.
   ============================================================================= */
const COTISATION_EUR = 20;
// Paiement en ligne : mettre à true quand le compte Stripe de l'association sera actif.
const ONLINE_PAYMENT_ENABLED = false;
// Règlement PayPal « entre amis » au trésorier. Le motif doit être normalisé :
// c'est la seule façon pour lui de rapprocher un virement d'un compte du site.
const PAYPAL_TRESORIER = "memo12a@yahoo.fr";
const PAYPAL_TRESORIER_NOM = "Fabien Delisle";
const paypalMotif = (u) => `ALADJ ${(u?.name || "").trim()}`;

// Anniversaire d'un membre en clair : « 14 mars » ou « 14 mars 1987 ».
// L'annee reste facultative : beaucoup ne renseignent que le jour et le mois.
function birthdayLabel(u, withYear = true) {
  if (!u || !u.birthDay || !u.birthMonth) return null;
  const mois = ["janvier", "février", "mars", "avril", "mai", "juin",
                "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
  const m = mois[Number(u.birthMonth) - 1] || "";
  return `${Number(u.birthDay)} ${m}${withYear && u.birthYear ? " " + u.birthYear : ""}`;
}

// Prochain anniversaire d'un membre, en nombre de jours (0 = aujourd'hui).
function daysUntilBirthday(u) {
  if (!u || !u.birthDay || !u.birthMonth) return null;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let next = new Date(now.getFullYear(), Number(u.birthMonth) - 1, Number(u.birthDay));
  if (next < today) next = new Date(now.getFullYear() + 1, Number(u.birthMonth) - 1, Number(u.birthDay));
  return Math.round((next - today) / 86400000);
}

// Membres dont l'anniversaire tombe à la date donnée (AAAA-MM-JJ).
function birthdayMembersOn(dateIso, users) {
  if (!dateIso) return [];
  const m = Number(dateIso.slice(5, 7)), d = Number(dateIso.slice(8, 10));
  return (users || []).filter((u) => !u.banned && u.birthMonth === m && u.birthDay === d);
}

function membershipDaysLeft(user) {
  if (!user?.decideurUntil) return 0;
  return Math.max(0, Math.ceil((new Date(user.decideurUntil) - new Date()) / 86400000));
}

function MembershipModal({ onClose, setToast }) {
  const { currentUser, reload } = useApp();
  const [mode, setMode] = useState(null); // null | "cash" | "paypal"
  const [cashOk, setCashOk] = useState(false);
  const [ppOk, setPpOk] = useState(false);
  const [copied, setCopied] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const daysLeft = membershipDaysLeft(currentUser);

  const callApi = async (action) => {
    setErr(""); setBusy(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Session expirée — reconnectez-vous.");
      const resp = await fetch("/api/membership", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ action }),
      });
      const out = await resp.json().catch(() => ({}));
      if (!resp.ok) throw new Error(out.error || "Le service de cotisation ne répond pas.");
      return out;
    } catch (e) {
      setErr(e.message); setBusy(false);
      return null;
    }
  };

  const payOnline = async () => {
    const out = await callApi("checkout");
    if (out?.url) window.location.href = out.url; // redirection vers la page de paiement
    else setBusy(false);
  };

  const commitCash = async () => {
    const out = await callApi("cash");
    setBusy(false);
    if (out?.ok) {
      setToast("Merci ! Votre statut de membre décisionnaire est actif — pensez au règlement en espèces auprès du bureau.");
      onClose();
      await reload();
    }
  };

  const commitPaypal = async () => {
    const out = await callApi("paypal");
    setBusy(false);
    if (out?.ok) {
      setToast("Merci ! Votre statut est actif — pensez à envoyer le paiement PayPal au trésorier.");
      onClose();
      await reload();
    }
  };

  // Copie discrète : l'adresse et le motif doivent être repris à l'identique
  // dans PayPal, une faute de frappe rendrait le rapprochement impossible.
  const copy = async (txt, quoi) => {
    try { await navigator.clipboard.writeText(txt); setCopied(quoi); setTimeout(() => setCopied(""), 2000); }
    catch (e) { setErr("Copie impossible — sélectionnez le texte à la main."); }
  };

  return (
    <Modal open onClose={onClose} title="👑 Cotisation — membre décisionnaire" width={540}>
      <p style={{ fontSize: 14, color: "#5e5346", lineHeight: 1.6, margin: "0 0 6px" }}>
        La cotisation de <b>{COTISATION_EUR} €</b> vous donne le statut de <b>membre décisionnaire</b> pour <b>365 jours</b> : voix délibérative en assemblée générale, pass Ludovore (Ludum.fr) offert pendant un an <b style={{ color: C.amber }}>(valeur 29,99 €)</b>, et les fonctionnalités du site qui y seront réservées.
      </p>
      {daysLeft > 0 && (
        <p style={{ fontSize: 13.5, color: C.teal, fontWeight: 700, margin: "0 0 6px" }}>
          Il vous reste {daysLeft} jour{daysLeft > 1 ? "s" : ""} de statut : les 365 nouveaux jours <u>s'ajouteront</u> (total : {daysLeft + 365} jours).
        </p>
      )}
      <p style={{ fontSize: 12.5, color: "#9c8d79", margin: "0 0 16px" }}>
        {ONLINE_PAYMENT_ENABLED
          ? <>Trois moyens de paiement sont acceptés : <b>en ligne</b>, <b>PayPal entre amis</b> au trésorier, ou <b>en espèces</b> auprès d'un membre du bureau. Chèques et virements bancaires sont refusés.</>
          : <>La cotisation se règle <b>en espèces</b> auprès d'un membre du bureau ou par <b>PayPal entre amis</b> au trésorier (le paiement par carte arrive prochainement). Chèques et virements bancaires sont refusés.</>}
      </p>

      {!mode && (
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr)", gap: 10 }}>
          {ONLINE_PAYMENT_ENABLED && <button onClick={payOnline} disabled={busy}
            style={{ textAlign: "left", padding: "15px 17px", borderRadius: 14, cursor: "pointer", display: "flex", gap: 13, alignItems: "center", border: `2px solid ${C.teal}`, background: "rgba(30,138,138,.06)" }}>
            <span style={{ fontSize: 24 }}>💳</span>
            <span style={{ flex: 1 }}>
              <span style={{ display: "block", fontFamily: "'Fredoka',sans-serif", fontWeight: 700, color: C.navy, fontSize: 15 }}>Payer en ligne — {COTISATION_EUR} €</span>
              <span style={{ fontSize: 12.5, color: "#8a7c6a" }}>Carte bancaire, Apple Pay, Google Pay ou PayPal. Statut activé immédiatement.</span>
            </span>
            {busy && <Loader2 size={17} className="aladj-spin" color={C.teal} />}
          </button>}
          <button onClick={() => setMode("paypal")} disabled={busy}
            style={{ textAlign: "left", padding: "15px 17px", borderRadius: 14, cursor: "pointer", display: "flex", gap: 13, alignItems: "center", border: `2px solid ${C.navy}33`, background: "#fff" }}>
            <span style={{ fontSize: 24 }}>🅿️</span>
            <span>
              <span style={{ display: "block", fontFamily: "'Fredoka',sans-serif", fontWeight: 700, color: C.navy, fontSize: 15 }}>PayPal entre amis</span>
              <span style={{ fontSize: 12.5, color: "#8a7c6a" }}>J'envoie {COTISATION_EUR} € à notre trésorier {PAYPAL_TRESORIER_NOM}.</span>
            </span>
          </button>
          <button onClick={() => setMode("cash")} disabled={busy}
            style={{ textAlign: "left", padding: "15px 17px", borderRadius: 14, cursor: "pointer", display: "flex", gap: 13, alignItems: "center", border: "2px solid #e6dcc9", background: "#fff" }}>
            <span style={{ fontSize: 24 }}>💶</span>
            <span>
              <span style={{ display: "block", fontFamily: "'Fredoka',sans-serif", fontWeight: 700, color: C.navy, fontSize: 15 }}>Régler en espèces</span>
              <span style={{ fontSize: 12.5, color: "#8a7c6a" }}>Je m'engage à remettre {COTISATION_EUR} € en espèces à un membre du bureau.</span>
            </span>
          </button>
        </div>
      )}

      {mode === "paypal" && (
        <div style={{ background: "rgba(26,58,92,.05)", border: `1.5px solid ${C.navy}22`, borderRadius: 14, padding: "15px 17px" }}>
          <p style={{ margin: "0 0 13px", fontSize: 13.5, color: "#5e5346", lineHeight: 1.6 }}>
            Envoyez <b>{COTISATION_EUR} €</b> depuis votre compte PayPal, en choisissant l'option
            <b> « Entre proches »</b> (et non « Biens et services ») : c'est ce qui évite les frais à l'association.
          </p>

          {[
            { l: "Adresse PayPal du trésorier", v: PAYPAL_TRESORIER, k: "mail", sub: PAYPAL_TRESORIER_NOM },
            { l: "Motif du paiement", v: paypalMotif(currentUser), k: "motif", sub: "À recopier exactement — c'est ce qui permet de vous identifier." },
          ].map((f) => (
            <div key={f.k} style={{ marginBottom: 11 }}>
              <span style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: C.navy, marginBottom: 4 }}>{f.l}</span>
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                <code style={{ flex: 1, minWidth: 140, background: "#fff", border: "1.5px solid #e6dcc9", borderRadius: 10, padding: "9px 12px", fontFamily: "monospace", fontSize: 14.5, color: C.navy, overflowWrap: "anywhere" }}>{f.v}</code>
                <Btn size="sm" variant={copied === f.k ? "teal" : "soft"} onClick={() => copy(f.v, f.k)}>
                  {copied === f.k ? <><Check size={14} /> Copié</> : "Copier"}
                </Btn>
              </div>
              <span style={{ display: "block", fontSize: 12, color: "#8a7c6a", marginTop: 3 }}>{f.sub}</span>
            </div>
          ))}

          <label style={{ display: "flex", gap: 10, alignItems: "flex-start", cursor: "pointer", fontSize: 13.5, color: "#5e5346", lineHeight: 1.55, marginTop: 4 }}>
            <input type="checkbox" checked={ppOk} onChange={(e) => setPpOk(e.target.checked)} style={{ marginTop: 3 }} />
            <span>J'ai envoyé (ou j'envoie dans la foulée) <b>{COTISATION_EUR} €</b> par <b>PayPal entre proches</b> à {PAYPAL_TRESORIER_NOM}, avec le motif indiqué ci-dessus. Je comprends que mon statut est activé dès maintenant sur cette déclaration, et que le trésorier en est informé.</span>
          </label>
          <div style={{ display: "flex", gap: 8, marginTop: 13, flexWrap: "wrap" }}>
            <Btn variant="amber" disabled={!ppOk || busy} onClick={commitPaypal}>
              {busy ? <Loader2 size={15} className="aladj-spin" /> : <><Check size={15} /> C'est envoyé — activer mon statut</>}
            </Btn>
            <Btn variant="soft" disabled={busy} onClick={() => { setMode(null); setPpOk(false); }}>Retour</Btn>
          </div>
        </div>
      )}

      {mode === "cash" && (
        <div style={{ background: "rgba(232,163,23,.08)", border: "1.5px solid #eedbA8", borderRadius: 14, padding: "15px 17px" }}>
          <label style={{ display: "flex", gap: 10, alignItems: "flex-start", cursor: "pointer", fontSize: 13.5, color: "#5e5346", lineHeight: 1.55 }}>
            <input type="checkbox" checked={cashOk} onChange={(e) => setCashOk(e.target.checked)} style={{ marginTop: 3 }} />
            <span>Je m'engage à régler ma cotisation de <b>{COTISATION_EUR} € en espèces</b> auprès d'un membre du bureau dans les meilleurs délais. Je comprends que mon statut est activé dès maintenant sur cet engagement, et que le bureau en est informé par e-mail.</span>
          </label>
          <div style={{ display: "flex", gap: 8, marginTop: 13 }}>
            <Btn variant="amber" disabled={!cashOk || busy} onClick={commitCash}>
              {busy ? <Loader2 size={15} className="aladj-spin" /> : <><Check size={15} /> Je m'engage — activer mon statut</>}
            </Btn>
            <Btn variant="soft" disabled={busy} onClick={() => { setMode(null); setCashOk(false); }}>Retour</Btn>
          </div>
        </div>
      )}

      {err && <div style={{ background: "rgba(181,40,58,.1)", color: C.red, padding: "10px 14px", borderRadius: 11, fontSize: 13.5, fontWeight: 600, marginTop: 14 }}>{err}</div>}
    </Modal>
  );
}

// Bandeau en haut de Mon espace : devenir décisionnaire / statut actif / expiration proche.
function MembershipBanner({ setToast }) {
  const { currentUser } = useApp();
  const [open, setOpen] = useState(false);
  if (!currentUser) return null;
  const daysLeft = membershipDaysLeft(currentUser);
  const expiring = daysLeft > 0 && daysLeft <= 15;
  let bg, content;
  if (daysLeft === 0) {
    bg = `linear-gradient(120deg, ${C.amber}, #c97f10)`;
    content = <>
      <span style={{ fontSize: 24 }}>👑</span>
      <div style={{ flex: 1, minWidth: 220 }}>
        <div style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 700, color: "#fff", fontSize: 16 }}>Devenir membre décisionnaire</div>
        <div style={{ fontSize: 13, color: "rgba(255,255,255,.9)" }}>Cotisation {COTISATION_EUR} €/an — voix en AG, pass Ludovore offert (valeur 29,99 €), et plus encore.</div>
      </div>
      <Btn variant="ghost" onClick={() => setOpen(true)} style={{ background: "#fff" }}>Adhérer</Btn>
    </>;
  } else if (expiring) {
    bg = `linear-gradient(120deg, ${C.red}, #8f1f2e)`;
    content = <>
      <span style={{ fontSize: 24 }}>⏳</span>
      <div style={{ flex: 1, minWidth: 220 }}>
        <div style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 700, color: "#fff", fontSize: 16 }}>Votre statut de membre décisionnaire se termine dans {daysLeft} jour{daysLeft > 1 ? "s" : ""} !</div>
        <div style={{ fontSize: 13, color: "rgba(255,255,255,.9)" }}>Réinscrivez-vous pour 365 jours — ils <b>s'ajouteront</b> à vos {daysLeft} jour{daysLeft > 1 ? "s" : ""} restants.</div>
      </div>
      <Btn variant="amber" onClick={() => setOpen(true)}>Renouveler</Btn>
    </>;
  } else {
    bg = `linear-gradient(120deg, ${C.teal}, ${C.navy})`;
    content = <>
      <span style={{ fontSize: 24 }}>👑</span>
      <div style={{ flex: 1, minWidth: 220 }}>
        <div style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 700, color: "#fff", fontSize: 16 }}>Vous êtes membre décisionnaire pendant encore {daysLeft} jours</div>
        <div style={{ fontSize: 13, color: "rgba(255,255,255,.85)" }}>Merci pour votre soutien ! Un renouvellement ajoutera 365 jours à ce total.</div>
      </div>
      <Btn variant="ghost" onClick={() => setOpen(true)} style={{ background: "rgba(255,255,255,.15)", color: "#fff" }}>Prolonger</Btn>
    </>;
  }
  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{ background: bg, borderRadius: 16, padding: "15px 20px", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
        {content}
      </div>
      {open && <MembershipModal onClose={() => setOpen(false)} setToast={setToast} />}
    </div>
  );
}

/* =============================================================================
   RÉTROSPECTIVE — le bilan ludique d'un membre sur une période (mois ou année),
   calculé en direct à partir des parties confirmées.
   ============================================================================= */
function computeRetro(uid, startIso, endIso, { plays, games, users }) {
  const allMine = (plays || [])
    .filter((pl) => pl.participants.some((pt) => pt.userId === uid && pt.confirmed !== false))
    .sort((a, b) => new Date(a.playedAt) - new Date(b.playedAt) || (a.occurrence || 1) - (b.occurrence || 1));
  const inRange = allMine.filter((pl) => pl.playedAt >= startIso && pl.playedAt < endIso);
  const won = (pl) => pl.participants.some((pt) => pt.userId === uid && pt.isWinner && pt.confirmed !== false);
  const wins = inRange.filter(won).length;
  const seconds = inRange.reduce((sum, pl) => sum + (pl.durationSeconds || 0), 0);
  // jeu fétiche de la période
  const byGame = {};
  inRange.forEach((pl) => { byGame[pl.gameId] = (byGame[pl.gameId] || 0) + 1; });
  const topGameId = Object.keys(byGame).sort((a, b) => byGame[b] - byGame[a])[0] || null;
  const topGame = topGameId ? { ...(games.find((g) => g.id === topGameId) || { name: "Un jeu" }), count: byGame[topGameId] } : null;
  // partenaire favori
  const byPartner = {};
  inRange.forEach((pl) => pl.participants.forEach((pt) => {
    if (pt.userId && pt.userId !== uid && pt.confirmed !== false) byPartner[pt.userId] = (byPartner[pt.userId] || 0) + 1;
  }));
  const topPartnerId = Object.keys(byPartner).sort((a, b) => byPartner[b] - byPartner[a])[0] || null;
  const topPartner = topPartnerId ? { name: users.find((u) => u.id === topPartnerId)?.name || "Un membre", count: byPartner[topPartnerId] } : null;
  // découvertes : jeux dont la toute première partie (de ce membre) tombe dans la période
  const firstPlayByGame = {};
  allMine.forEach((pl) => { if (!firstPlayByGame[pl.gameId]) firstPlayByGame[pl.gameId] = pl.playedAt; });
  const discoveries = Object.keys(firstPlayByGame).filter((gid) => firstPlayByGame[gid] >= startIso && firstPlayByGame[gid] < endIso).length;
  // meilleure série de victoires de la période
  let streak = 0, bestStreak = 0;
  inRange.forEach((pl) => { streak = won(pl) ? streak + 1 : 0; if (streak > bestStreak) bestStreak = streak; });
  return {
    plays: inRange.length, wins, hours: Math.round(seconds / 360) / 10,
    distinctGames: Object.keys(byGame).length, topGame, topPartner, discoveries, bestStreak,
  };
}

function RetroStat({ big, label, emoji }) {
  return (
    <div style={{ background: "rgba(255,255,255,.12)", borderRadius: 14, padding: "13px 10px", textAlign: "center" }}>
      <div style={{ fontSize: 21 }}>{emoji}</div>
      <div style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 700, fontSize: 27, color: "#fff", lineHeight: 1.1 }}>{big}</div>
      <div style={{ fontSize: 11.5, color: "rgba(255,255,255,.75)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em" }}>{label}</div>
    </div>
  );
}

function RetroModal({ open, onClose }) {
  const { plays, games, users, currentUser } = useApp();
  const now = new Date();
  const monthNames = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
  // Périodes proposées : mois dernier, mois en cours, année en cours, année dernière.
  const periods = useMemo(() => {
    const y = now.getFullYear(), m = now.getMonth();
    const iso = (yy, mm) => new Date(Date.UTC(yy, mm, 1)).toISOString();
    const pm = m === 0 ? { y: y - 1, m: 11 } : { y, m: m - 1 };
    return [
      { key: "lastMonth", label: `${monthNames[pm.m]} ${pm.y}`, kind: "month", start: iso(pm.y, pm.m), end: iso(pm.m === 11 ? pm.y + 1 : pm.y, (pm.m + 1) % 12) },
      { key: "thisMonth", label: `${monthNames[m]} ${y} (en cours)`, kind: "month", start: iso(y, m), end: iso(m === 11 ? y + 1 : y, (m + 1) % 12) },
      { key: "thisYear", label: `Année ${y} (en cours)`, kind: "year", start: iso(y, 0), end: iso(y + 1, 0) },
      { key: "lastYear", label: `Année ${y - 1}`, kind: "year", start: iso(y - 1, 0), end: iso(y, 0) },
    ];
  }, []); // eslint-disable-line
  const [periodKey, setPeriodKey] = useState("lastMonth");
  const period = periods.find((p) => p.key === periodKey) || periods[0];
  const r = useMemo(
    () => (currentUser ? computeRetro(currentUser.id, period.start, period.end, { plays, games, users }) : null),
    [currentUser, period, plays, games, users]
  );
  const badgesEarned = useMemo(
    () => (currentUser && period.kind === "year" ? badgesFor(currentUser.id, { plays, events: [], games, upcoming: [], beltByGame: {} }).filter((b) => b.tier > 0).length : 0),
    [currentUser, period, plays, games]
  );
  if (!open || !currentUser || !r) return null;
  const isYear = period.kind === "year";
  return (
    <Modal open onClose={onClose} title="🎁 Ma rétrospective" width={560}>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
        {periods.map((p) => (
          <button key={p.key} onClick={() => setPeriodKey(p.key)}
            style={{ padding: "6px 13px", borderRadius: 999, cursor: "pointer", fontFamily: "'Fredoka',sans-serif", fontWeight: 600, fontSize: 12.5, border: `2px solid ${p.key === periodKey ? C.teal : "#e6dcc9"}`, background: p.key === periodKey ? C.teal : "#fff", color: p.key === periodKey ? "#fff" : "#8a7c6a" }}>
            {p.label}
          </button>
        ))}
      </div>

      <div style={{ background: `linear-gradient(140deg, ${C.navy}, ${C.teal})`, borderRadius: 20, padding: "22px 20px", marginBottom: 14 }}>
        <div style={{ textAlign: "center", marginBottom: 16 }}>
          <div style={{ fontSize: 30 }}>✨</div>
          <div style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 700, fontSize: 20, color: "#fff" }}>{currentUser.name} — {period.label}</div>
        </div>
        {r.plays === 0 ? (
          <p style={{ textAlign: "center", color: "rgba(255,255,255,.85)", fontSize: 14.5, margin: "0 0 6px" }}>
            Aucune partie enregistrée sur cette période… la prochaine sera la bonne ! 🎲
          </p>
        ) : (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(105px, 1fr))", gap: 9, marginBottom: 12 }}>
              <RetroStat emoji="🎲" big={r.plays} label={r.plays > 1 ? "parties" : "partie"} />
              <RetroStat emoji="🏆" big={r.wins} label={r.wins > 1 ? "victoires" : "victoire"} />
              <RetroStat emoji="🧭" big={r.distinctGames} label={r.distinctGames > 1 ? "jeux différents" : "jeu"} />
              {r.hours > 0 && <RetroStat emoji="⏱️" big={`${String(r.hours).replace(".", ",")} h`} label="de jeu" />}
            </div>
            {r.topGame && (
              <div style={{ display: "flex", alignItems: "center", gap: 12, background: "rgba(255,255,255,.12)", borderRadius: 14, padding: "10px 13px", marginBottom: isYear ? 9 : 0 }}>
                <div style={{ width: 46, height: 46, borderRadius: 10, flexShrink: 0, background: r.topGame.img ? `center/cover url("${r.topGame.img}")` : "rgba(255,255,255,.25)" }} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 11.5, color: "rgba(255,255,255,.75)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em" }}>{isYear ? "Jeu de l'année" : "Jeu du mois"}</div>
                  <div style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 700, color: "#fff", fontSize: 16 }}>{r.topGame.name} <span style={{ fontWeight: 400, fontSize: 13, color: "rgba(255,255,255,.8)" }}>· {r.topGame.count} partie{r.topGame.count > 1 ? "s" : ""}</span></div>
                </div>
              </div>
            )}
            {isYear && (
              <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr)", gap: 7 }}>
                {r.topPartner && (
                  <div style={{ display: "flex", alignItems: "center", gap: 9, background: "rgba(255,255,255,.12)", borderRadius: 12, padding: "9px 13px", color: "#fff", fontSize: 14 }}>
                    🤝 <span>Partenaire de jeu favori : <b>{r.topPartner.name}</b> ({r.topPartner.count} partie{r.topPartner.count > 1 ? "s" : ""} ensemble)</span>
                  </div>
                )}
                {r.discoveries > 0 && (
                  <div style={{ display: "flex", alignItems: "center", gap: 9, background: "rgba(255,255,255,.12)", borderRadius: 12, padding: "9px 13px", color: "#fff", fontSize: 14 }}>
                    💡 <span><b>{r.discoveries}</b> jeu{r.discoveries > 1 ? "x" : ""} découvert{r.discoveries > 1 ? "s" : ""} cette année</span>
                  </div>
                )}
                {r.bestStreak >= 2 && (
                  <div style={{ display: "flex", alignItems: "center", gap: 9, background: "rgba(255,255,255,.12)", borderRadius: 12, padding: "9px 13px", color: "#fff", fontSize: 14 }}>
                    🔥 <span>Meilleure série : <b>{r.bestStreak} victoires d'affilée</b></span>
                  </div>
                )}
                {badgesEarned > 0 && (
                  <div style={{ display: "flex", alignItems: "center", gap: 9, background: "rgba(255,255,255,.12)", borderRadius: 12, padding: "9px 13px", color: "#fff", fontSize: 14 }}>
                    🎖️ <span><b>{badgesEarned}</b> badge{badgesEarned > 1 ? "s" : ""} à votre tableau de chasse</span>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
      <p style={{ fontSize: 12.5, color: "#9c8d79", margin: 0, textAlign: "center" }}>
        Basée sur vos parties confirmées. La version du mois dernier arrive aussi par e-mail chaque début de mois (désactivable plus bas dans Mon espace).
      </p>
    </Modal>
  );
}

// Bannière « Ma rétrospective » de Mon espace.
function MyRetroSection() {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{ background: `linear-gradient(120deg, ${C.navy}, ${C.teal})`, borderRadius: 16, padding: "16px 20px", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
        <span style={{ fontSize: 26 }}>🎁</span>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 700, color: "#fff", fontSize: 16 }}>Ma rétrospective</div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,.8)" }}>Votre bilan ludique du mois ou de l'année : parties, victoires, jeu fétiche…</div>
        </div>
        <Btn variant="amber" onClick={() => setOpen(true)}>Découvrir</Btn>
      </div>
      <RetroModal open={open} onClose={() => setOpen(false)} />
    </div>
  );
}

/* =============================================================================
   TOP 10 EVER — les 10 jeux qu'un membre garderait s'il n'y avait plus qu'eux.
   ============================================================================= */
// Liste ordonnée d'un top 10 (couverture + rang), réutilisée dans Mon espace et
// sur la fiche d'un membre.
function Top10List({ ids, onOpenGame }) {
  const { games } = useApp();
  const list = (ids || []).map((id) => games.find((g) => g.id === id)).filter(Boolean);
  if (!list.length) return null;
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 10 }}>
      {list.map((g, i) => (
        <div key={g.id} onClick={onOpenGame ? () => onOpenGame(g.id) : undefined}
          style={{ position: "relative", display: "flex", alignItems: "center", gap: 9, minWidth: 0, background: "#fff", border: "1px solid #ece2d0", borderRadius: 12, padding: "7px 9px", cursor: onOpenGame ? "pointer" : "default" }}>
          <span style={{ position: "absolute", top: -7, left: -7, width: 24, height: 24, borderRadius: "50%", background: i === 0 ? C.amber : C.navy, color: "#fff", display: "grid", placeItems: "center", fontFamily: "'Fredoka',sans-serif", fontWeight: 700, fontSize: 12, border: "2px solid #FBF7EF" }}>{i + 1}</span>
          <div style={{ width: 38, height: 38, borderRadius: 8, flexShrink: 0, background: g.img ? `center/cover url("${g.img}")` : `linear-gradient(135deg,${C.teal},${C.navy})` }} />
          <span style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 600, fontSize: 12.5, color: C.navy, lineHeight: 1.2, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{g.name}</span>
        </div>
      ))}
    </div>
  );
}

// Éditeur du top 10 : recherche d'un jeu, liste ordonnée avec montée/descente/retrait.
// Boutons de réordonnancement du top 10 : cibles tactiles de 28 px, jamais compressées.
const top10BtnStyle = {
  border: "none", background: "none", padding: 0, width: 28, height: 28, flexShrink: 0,
  display: "grid", placeItems: "center", borderRadius: 8, fontSize: 12, lineHeight: 1,
};

function Top10Editor({ open, onClose, setToast }) {
  const { games, currentUser, updateProfile } = useApp();
  const [ids, setIds] = useState([]);
  const [q, setQ] = useState("");
  const [listOpen, setListOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (open) { setIds((currentUser?.topGames || []).filter((id) => games.some((g) => g.id === id))); setQ(""); setListOpen(false); } }, [open, currentUser, games]);
  const norm = (x) => (x || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const results = useMemo(() => {
    const query = norm(q);
    return [...(games || [])]
      .filter((g) => !ids.includes(g.id) && (!query || norm(g.name).includes(query)))
      .sort((a, b) => a.name.localeCompare(b.name)).slice(0, 60);
  }, [games, ids, q]);
  const move = (i, d) => setIds((arr) => {
    const j = i + d;
    if (j < 0 || j >= arr.length) return arr;
    const cp = [...arr]; [cp[i], cp[j]] = [cp[j], cp[i]]; return cp;
  });
  const save = async () => {
    setBusy(true);
    await updateProfile({ topGames: ids });
    setBusy(false);
    setToast("Votre top 10 est enregistré !");
    onClose();
  };
  if (!open) return null;
  const fieldStyle = { width: "100%", padding: "9px 11px", borderRadius: 10, border: "1.5px solid #e6dcc9", fontFamily: "'Nunito',sans-serif", fontSize: 14, background: "#fff", color: C.navy, boxSizing: "border-box" };
  return (
    <Modal open onClose={onClose} title="💎 Mon top 10 ever" width={560}>
      <p style={{ fontSize: 13.5, color: "#6e6256", margin: "0 0 14px", lineHeight: 1.55 }}>
        Les 10 jeux que vous garderiez s'il n'y avait plus que ça à jouer sur Terre — dans l'ordre. Vous pourrez le modifier quand vous voulez.
      </p>
      {ids.length < 10 && (
        <div style={{ position: "relative", marginBottom: 14 }}>
          <input value={q} onChange={(e) => { setQ(e.target.value); setListOpen(true); }} onFocus={() => setListOpen(true)}
            onBlur={() => setTimeout(() => setListOpen(false), 150)} placeholder={`Ajouter le n°${ids.length + 1} — tape le nom d'un jeu…`} style={fieldStyle} />
          {listOpen && (
            <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, maxHeight: 210, overflowY: "auto", background: "#fff", border: "1.5px solid #e6dcc9", borderRadius: 10, zIndex: 40, boxShadow: "0 8px 24px rgba(0,0,0,.14)" }}>
              {results.length === 0 && <div style={{ padding: "10px 12px", color: "#9c8d79", fontSize: 13.5 }}>Aucun jeu trouvé.</div>}
              {results.map((g) => (
                <button key={g.id} type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => { setIds((arr) => [...arr, g.id]); setQ(""); setListOpen(false); }}
                  style={{ display: "block", width: "100%", textAlign: "left", padding: "8px 12px", border: "none", borderBottom: "1px solid #f4ecda", background: "#fff", cursor: "pointer", fontSize: 14, color: C.navy, fontFamily: "'Nunito',sans-serif" }}>
                  {g.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr)", gap: 6, marginBottom: 16 }}>
        {ids.length === 0 && <div style={{ textAlign: "center", color: "#a89a86", fontSize: 13.5, padding: "14px 0" }}>Votre podium est vide — ajoutez votre premier jeu ci-dessus.</div>}
        {ids.map((id, i) => {
          const g = games.find((x) => x.id === id);
          if (!g) return null;
          return (
            <div key={id} style={{ display: "flex", alignItems: "center", gap: 7, minWidth: 0, background: "#fff", border: "1px solid #ece2d0", borderRadius: 11, padding: "6px 7px 6px 9px" }}>
              <span style={{ width: 24, height: 24, borderRadius: "50%", background: i === 0 ? C.amber : C.navy, color: "#fff", display: "grid", placeItems: "center", fontFamily: "'Fredoka',sans-serif", fontWeight: 700, fontSize: 12, flexShrink: 0 }}>{i + 1}</span>
              <div style={{ width: 32, height: 32, borderRadius: 7, flexShrink: 0, background: g.img ? `center/cover url("${g.img}")` : `linear-gradient(135deg,${C.teal},${C.navy})` }} />
              <span style={{ flex: "1 1 0", fontFamily: "'Fredoka',sans-serif", fontWeight: 600, fontSize: 13.5, color: C.navy, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{g.name}</span>
              <button type="button" title="Monter" onClick={() => move(i, -1)} disabled={i === 0} style={{ ...top10BtnStyle, cursor: i === 0 ? "default" : "pointer", color: i === 0 ? "#ddd2bd" : C.navy }}>▲</button>
              <button type="button" title="Descendre" onClick={() => move(i, 1)} disabled={i === ids.length - 1} style={{ ...top10BtnStyle, cursor: i === ids.length - 1 ? "default" : "pointer", color: i === ids.length - 1 ? "#ddd2bd" : C.navy }}>▼</button>
              <button type="button" title="Retirer du classement" onClick={() => setIds((arr) => arr.filter((x) => x !== id))} style={{ ...top10BtnStyle, cursor: "pointer", color: C.red }}><X size={15} /></button>
            </div>
          );
        })}
      </div>
      <Btn full size="lg" onClick={save} disabled={busy}>{busy ? <Loader2 size={18} className="aladj-spin" /> : <><Check size={17} /> Enregistrer mon top 10</>}</Btn>
    </Modal>
  );
}

// Section « Mon top 10 ever » de Mon espace, juste au-dessus de Ma ludothèque.
function MyTop10Section({ setToast, onOpenGame }) {
  const { currentUser, games } = useApp();
  const [editOpen, setEditOpen] = useState(false);
  if (!currentUser) return null;
  const ids = (currentUser.topGames || []).filter((id) => games.some((g) => g.id === id));
  return (
    <div style={{ marginBottom: 26 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
        <h3 style={{ fontFamily: "'Fredoka',sans-serif", color: C.navy, fontSize: 17, margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 20 }}>💎</span> Mon top 10 ever
        </h3>
        {ids.length > 0 && <Btn size="sm" variant="soft" onClick={() => setEditOpen(true)}><PenLine size={13} /> Modifier</Btn>}
      </div>
      {ids.length === 0 ? (
        <div style={{ background: "rgba(232,163,23,.08)", border: "1.5px dashed #e3c98a", borderRadius: 14, padding: "18px 20px", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          <span style={{ flex: 1, minWidth: 220, fontSize: 13.5, color: "#6e6256", lineHeight: 1.55 }}>
            S'il ne restait plus que <b>10 jeux</b> à jouer sur Terre, lesquels garderiez-vous ? Composez votre top 10 : il sera visible sur votre fiche et sur celle de chaque jeu élu.
          </span>
          <Btn variant="amber" onClick={() => setEditOpen(true)}>💎 Composer mon top 10</Btn>
        </div>
      ) : (
        <Top10List ids={ids} onOpenGame={onOpenGame} />
      )}
      <Top10Editor open={editOpen} onClose={() => setEditOpen(false)} setToast={setToast} />
    </div>
  );
}

function MyPlaysSection({ setToast }) {
  const { plays, currentUser, games, declinePlayParticipation, setMyPlayResult, askConfirm } = useApp();
  const mk = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  const monthLabel = (key) => {
    const [y, m] = key.split("-").map(Number);
    const s = new Date(y, m - 1, 1).toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
    return s.charAt(0).toUpperCase() + s.slice(1);
  };
  const now = new Date();
  const [active, setActive] = useState("month"); // "month" | "year" | "all"
  const [monthSel, setMonthSel] = useState(() => mk(new Date()));
  const [yearSel, setYearSel] = useState(() => String(new Date().getFullYear()));
  const [allOpen, setAllOpen] = useState(false);
  const [detailGameId, setDetailGameId] = useState(null);
  const [openPlayId, setOpenPlayId] = useState(null); // partie dépliée (scores)
  const [sheetGameId, setSheetGameId] = useState(null); // fiche de jeu ouverte depuis l'en-tete
  const gameById = useMemo(() => { const m = {}; (games || []).forEach((g) => { m[g.id] = g; }); return m; }, [games]);
  const myPlays = useMemo(
    () => (currentUser ? (plays || []).filter((pl) => pl.participants.some((pt) => pt.userId === currentUser.id && pt.confirmed !== false)) : []).sort((a, b) => new Date(b.playedAt) - new Date(a.playedAt)),
    [plays, currentUser]
  );
  // Liste des mois disponibles (mois du jour toujours inclus), du plus recent au plus ancien.
  const monthsList = useMemo(() => {
    const set = new Set(myPlays.map((pl) => mk(new Date(pl.playedAt))));
    set.add(mk(now));
    return [...set].sort().reverse();
  }, [myPlays]);
  // Liste des annees disponibles (annee en cours toujours incluse), decroissante.
  const yearsList = useMemo(() => {
    const set = new Set(myPlays.map((pl) => new Date(pl.playedAt).getFullYear()));
    set.add(now.getFullYear());
    return [...set].sort((a, b) => b - a);
  }, [myPlays]);
  if (!currentUser) return null;

  const inPeriod = (pl) => {
    const d = new Date(pl.playedAt);
    if (active === "all") return true;
    if (active === "month") return mk(d) === monthSel;
    return d.getFullYear() === Number(yearSel);
  };
  const filtered = myPlays.filter(inPeriod);
  const by = {};
  filtered.forEach((pl) => {
    const won = pl.participants.some((pt) => pt.userId === currentUser.id && pt.isWinner);
    const e = (by[pl.gameId] ||= { gameId: pl.gameId, count: 0, wins: 0 });
    e.count++; if (won) e.wins++;
  });
  const ranking = Object.values(by).sort((a, b) => b.count - a.count);
  const top = ranking.slice(0, 20);
  const selLabel = active === "all" ? "depuis toujours" : active === "month" ? monthLabel(monthSel) : yearSel;

  const openSelection = () => { setDetailGameId(null); setAllOpen(true); };
  const openGame = (id) => { setDetailGameId(id); setAllOpen(true); };
  const closeModal = () => { setAllOpen(false); setDetailGameId(null); };

  const detailGame = detailGameId != null ? gameById[detailGameId] : null;
  const detailEntry = ranking.find((r) => r.gameId === detailGameId);
  const detailPlays = detailGameId != null ? myPlays.filter((pl) => pl.gameId === detailGameId && inPeriod(pl)) : [];

  const selStyle = (isActive) => ({
    border: "none", cursor: "pointer", borderRadius: 999, padding: "5px 30px 5px 13px",
    fontFamily: "'Nunito',sans-serif", fontWeight: 700, fontSize: 13, lineHeight: 1.5,
    background: isActive ? C.amber : "rgba(232,163,23,.12)", color: isActive ? "#fff" : "#8a6a1f",
    appearance: "none", WebkitAppearance: "none", MozAppearance: "none", outline: "none",
  });

  return (
    <div style={{ marginBottom: 22 }}>
      <h3 style={{ fontFamily: "'Fredoka',sans-serif", color: C.navy, fontSize: 17, margin: "0 0 12px", display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 20 }}>🎲</span> Mes parties
      </h3>
      <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 14, alignItems: "center" }}>
        <span style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
          <select value={monthSel} onMouseDown={() => setActive("month")} onChange={(e) => { setMonthSel(e.target.value); setActive("month"); }} style={selStyle(active === "month")} title="Choisir un mois">
            {monthsList.map((k) => <option key={k} value={k}>{monthLabel(k)}</option>)}
          </select>
          <ChevronDown size={14} style={{ position: "absolute", right: 10, pointerEvents: "none", color: active === "month" ? "#fff" : "#8a6a1f" }} />
        </span>
        <span style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
          <select value={yearSel} onMouseDown={() => setActive("year")} onChange={(e) => { setYearSel(e.target.value); setActive("year"); }} style={selStyle(active === "year")} title="Choisir une annee">
            {yearsList.map((y) => <option key={y} value={String(y)}>{y}</option>)}
          </select>
          <ChevronDown size={14} style={{ position: "absolute", right: 10, pointerEvents: "none", color: active === "year" ? "#fff" : "#8a6a1f" }} />
        </span>
        <button onClick={() => setActive("all")} style={{ border: "none", cursor: "pointer", borderRadius: 999, padding: "5px 13px", fontFamily: "'Nunito',sans-serif", fontWeight: 700, fontSize: 13, background: active === "all" ? C.amber : "rgba(232,163,23,.12)", color: active === "all" ? "#fff" : "#8a6a1f" }}>Depuis toujours</button>
      </div>
      {filtered.length === 0 ? (
        <div style={{ background: "#FBF7EF", border: "1px solid #ece2d0", borderRadius: 14, padding: "18px 20px", color: "#9c8d79", fontSize: 14 }}>
          Aucune partie enregistrée sur cette période. Lance le chronomètre ou utilise « Enregistrer une partie jouée ».
        </div>
      ) : (
        <div style={{ background: "#fff", border: "1px solid #ece2d0", borderRadius: 16, padding: "14px 18px" }}>
          <div style={{ fontSize: 13.5, color: "#6b5d49", marginBottom: 10 }}>
            <b style={{ color: C.navy, fontFamily: "'Fredoka',sans-serif", fontSize: 16 }}>{filtered.length}</b> partie{filtered.length > 1 ? "s" : ""} · <b style={{ color: C.navy }}>{ranking.length}</b> jeu{ranking.length > 1 ? "x" : ""} différent{ranking.length > 1 ? "s" : ""}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr)", gap: 6 }}>
            {top.map((r, i) => {
              const g = gameById[r.gameId];
              return (
                <div key={r.gameId} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, minWidth: 0 }}>
                  <span style={{ width: 20, flexShrink: 0, textAlign: "right", color: "#c3b49b", fontFamily: "'Fredoka',sans-serif", fontWeight: 700 }}>{i + 1}</span>
                  <button onClick={() => openGame(r.gameId)} title="Voir les parties de ce jeu" style={{ flex: 1, minWidth: 0, textAlign: "left", background: "none", border: "none", padding: 0, cursor: "pointer", fontFamily: "'Nunito',sans-serif", fontWeight: 600, fontSize: 14, color: C.navy, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{g?.name || "Jeu supprimé"}</button>
                  {r.wins > 0 && <span title={r.wins + " victoire(s)"} style={{ color: C.amber, fontWeight: 700, fontSize: 12.5, flexShrink: 0 }}>🏆 {r.wins}</span>}
                  <span style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 700, color: C.teal, flexShrink: 0 }}>{r.count}</span>
                </div>
              );
            })}
          </div>
          {ranking.length > 20 && <div style={{ fontSize: 12.5, color: "#9c8d79", marginTop: 8 }}>… et {ranking.length - 20} autre{ranking.length - 20 > 1 ? "s" : ""} jeu{ranking.length - 20 > 1 ? "x" : ""}</div>}
          <button onClick={openSelection} style={{ background: "none", border: "none", color: C.teal, fontSize: 13, textDecoration: "underline", textUnderlineOffset: 2, cursor: "pointer", padding: "12px 0 0", fontFamily: "'Nunito',sans-serif" }}>
            Voir toute la sélection ({ranking.length} jeu{ranking.length > 1 ? "x" : ""})
          </button>
        </div>
      )}
      <Modal open={allOpen} onClose={closeModal} width={540} title={detailGame ? (
        <span style={{ display: "inline-flex", alignItems: "baseline", gap: 6, flexWrap: "wrap", minWidth: 0 }}>
          <button type="button" onClick={() => setSheetGameId(detailGame.id)} title={`Ouvrir la fiche de ${detailGame.name}`}
            style={{ background: "none", border: "none", padding: 0, cursor: "pointer", font: "inherit", color: C.teal, textDecoration: "underline", textUnderlineOffset: 3, overflowWrap: "anywhere", textAlign: "left" }}>
            {detailGame.name}
          </button>
          <span style={{ fontSize: 14, fontWeight: 400, color: "#9c8d79" }}>· {selLabel}</span>
        </span>
      ) : (detailGameId != null ? `Jeu supprimé · ${selLabel}` : `Ma sélection · ${selLabel}`)}>
        {detailGameId == null ? (
          <>
            <div style={{ fontSize: 13.5, color: "#6b5d49", marginBottom: 12 }}>
              <b style={{ color: C.navy, fontFamily: "'Fredoka',sans-serif", fontSize: 16 }}>{filtered.length}</b> partie{filtered.length > 1 ? "s" : ""} · <b style={{ color: C.navy }}>{ranking.length}</b> jeu{ranking.length > 1 ? "x" : ""} différent{ranking.length > 1 ? "s" : ""}
            </div>
            {ranking.length === 0 ? (
              <div style={{ color: "#9c8d79" }}>Aucune partie sur cette période.</div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr)", gap: 6 }}>
                {ranking.map((r, i) => {
                  const g = gameById[r.gameId];
                  return (
                    <button key={r.gameId} onClick={() => setDetailGameId(r.gameId)} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, background: "#FBF7EF", border: "1px solid #ece2d0", borderRadius: 10, padding: "9px 11px", cursor: "pointer", textAlign: "left", width: "100%", minWidth: 0 }}>
                      <span style={{ width: 22, flexShrink: 0, textAlign: "right", color: "#c3b49b", fontFamily: "'Fredoka',sans-serif", fontWeight: 700 }}>{i + 1}</span>
                      <span style={{ flex: 1, minWidth: 0, fontWeight: 600, color: C.navy, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{g?.name || "Jeu supprimé"}</span>
                      {r.wins > 0 && <span title={r.wins + " victoire(s)"} style={{ color: C.amber, fontWeight: 700, fontSize: 12.5, flexShrink: 0 }}>🏆 {r.wins}</span>}
                      <span style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 700, color: C.teal, flexShrink: 0 }}>{r.count}</span>
                      <ChevronRight size={16} style={{ color: "#c3b49b" }} />
                    </button>
                  );
                })}
              </div>
            )}
          </>
        ) : (
          <>
            <button onClick={() => setDetailGameId(null)} style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "rgba(26,58,92,.06)", border: "none", borderRadius: 999, padding: "6px 13px", cursor: "pointer", fontFamily: "'Nunito',sans-serif", fontWeight: 700, fontSize: 13, color: C.navy, marginBottom: 12 }}>
              <ArrowRight size={14} style={{ transform: "rotate(180deg)" }} /> Retour à la sélection
            </button>
            <div style={{ fontSize: 13.5, color: "#6b5d49", marginBottom: 10 }}>
              <b style={{ color: C.navy, fontFamily: "'Fredoka',sans-serif", fontSize: 16 }}>{detailPlays.length}</b> partie{detailPlays.length > 1 ? "s" : ""}
              {detailEntry && detailEntry.wins > 0 ? <> · <span style={{ color: C.amber, fontWeight: 700 }}>🏆 {detailEntry.wins} victoire{detailEntry.wins > 1 ? "s" : ""}</span></> : null}
              <span style={{ color: "#9c8d79" }}> · {selLabel}</span>
            </div>
            {detailPlays.length === 0 ? (
              <div style={{ color: "#9c8d79" }}>Plus aucune partie sur cette période.</div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr)", gap: 7 }}>
                {detailPlays.map((pl) => {
                  const iWon = pl.participants.some((pt) => pt.userId === currentUser.id && pt.isWinner);
                  const hasScores = (pl.participants || []).some((pt) => pt.score != null && pt.confirmed !== false);
                  const open = openPlayId === pl.id;
                  return (
                    <div key={pl.id} style={{ background: "#FBF7EF", border: "1px solid #ece2d0", borderRadius: 10, padding: "8px 11px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <button onClick={() => hasScores && setOpenPlayId(open ? null : pl.id)} disabled={!hasScores}
                        title={hasScores ? "Voir les scores de cette partie" : undefined}
                        style={{ flex: 1, minWidth: 0, textAlign: "left", background: "none", border: "none", padding: 0, cursor: hasScores ? "pointer" : "default", fontFamily: "'Nunito',sans-serif", fontSize: 13, color: "#6b5d49" }}>
                        {new Date(pl.playedAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}{pl.sessionId ? " · chronométrée" : ""}
                        {hasScores && <span style={{ color: C.teal, fontWeight: 700 }}> · scores {open ? "▾" : "▸"}</span>}
                      </button>
                      <button onClick={async () => { const r = await setMyPlayResult(pl.id, !iWon); if (r?.error && setToast) setToast("Impossible d'enregistrer le résultat : " + r.error); }}
                        title={iWon ? "Vous etes declare vainqueur - cliquer pour retirer" : "Me declarer vainqueur"}
                        style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 9px", borderRadius: 999, cursor: "pointer", fontFamily: "'Fredoka',sans-serif", fontWeight: 600, fontSize: 12, whiteSpace: "nowrap", border: `1.5px solid ${iWon ? C.amber : "#e0d4bf"}`, background: iWon ? C.amber : "#fff", color: iWon ? "#fff" : "#a89a86" }}>
                        🏆 {iWon ? "Vainqueur" : "Vainqueur ?"}
                      </button>
                      <button onClick={async () => { if (await askConfirm({ title: "Retirer cette partie ?", message: "Cette partie sera retirée de votre historique. Les autres joueurs de la partie ne sont pas affectés.", confirmLabel: "Retirer" })) { const r = await declinePlayParticipation(pl.id); if (r?.error && setToast) setToast("Impossible de retirer la partie : " + r.error); } }} title="Retirer de mon historique" style={{ border: "none", background: "transparent", color: C.red, cursor: "pointer", display: "grid", placeItems: "center" }}><Trash2 size={15} /></button>
                    </div>
                    {open && <PlayScoreBoard play={pl} game={gameById[pl.gameId]} compact />}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </Modal>
      {sheetGameId != null && gameById[sheetGameId] && (
        <GameDetailModal g={gameById[sheetGameId]} onClose={() => setSheetGameId(null)} onAuth={() => {}} setToast={setToast || (() => {})} />
      )}
    </div>
  );
}

function RecordPlayModal({ open, onClose, setToast, defaultGameId }) {
  const { games, users, currentUser, recordManualPlay, reload, householdGuests, addHouseholdGuest } = useApp();
  const [gameId, setGameId] = useState(defaultGameId || "");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [parts, setParts] = useState([]);
  const [guestName, setGuestName] = useState("");
  const [busy, setBusy] = useState(false);
  const [gameSearch, setGameSearch] = useState("");
  const [gameListOpen, setGameListOpen] = useState(false);
  // Sens du score, comme dans le chrono : pré-rempli depuis la fiche du jeu.
  const [scoreDir, setScoreDir] = useState("high");
  // Passe à true dès qu'on coche un trophée à la main : on cesse alors le calcul auto.
  const [winnersTouched, setWinnersTouched] = useState(false);
  const [scorePadFor, setScorePadFor] = useState(null); // joueur dont on saisit le score
  // Mode equipe : le score saisi pour un joueur vaut pour tous ses coequipiers.
  const [teamsOn, setTeamsOn] = useState(false);
  // Ecran affiche apres l'enregistrement : { gameName, count } -- il permet
  // d'enchainer sans tout ressaisir. `count` compte les parties de la serie.
  const [justSaved, setJustSaved] = useState(null);
  // Réinitialisation à l'OUVERTURE de la fenêtre, et à ce moment-là seulement.
  // Auparavant l'effet dépendait de l'objet `currentUser`, recréé à chaque
  // rechargement des données : enregistrer une partie le relançait, ce qui
  // effaçait l'écran « on enchaîne ? » et remettait la liste des joueurs à zéro.
  const wasOpenRef = useRef(false);
  useEffect(() => {
    if (open && !wasOpenRef.current) {
      setGameId(defaultGameId || ""); setGuestName(""); setDate(new Date().toISOString().slice(0, 10)); setGameSearch(""); setGameListOpen(false);
      setWinnersTouched(false); setScorePadFor(null); setTeamsOn(false); setJustSaved(null);
      // L'auteur est pré-ajouté aux participants (retirable d'une croix s'il note la partie pour d'autres).
      setParts(currentUser ? [{ key: currentUser.id, userId: currentUser.id, guestName: null, name: currentUser.name, isWinner: false, score: "" }] : []);
    }
    wasOpenRef.current = open;
  }, [open, defaultGameId, currentUser?.id]); // eslint-disable-line

  const fieldStyle = { width: "100%", padding: "9px 11px", borderRadius: 10, border: "1.5px solid #e6dcc9", fontFamily: "'Nunito',sans-serif", fontSize: 14, background: "#fff", color: C.navy, boxSizing: "border-box" };
  const sortedGames = useMemo(() => [...(games || [])].sort((a, b) => a.name.localeCompare(b.name)), [games]);
  const norm = (x) => (x || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const filteredGames = useMemo(() => {
    const q = norm(gameSearch);
    return (q ? sortedGames.filter((g) => norm(g.name).includes(q)) : sortedGames).slice(0, 60);
  }, [sortedGames, gameSearch]);
  const available = (users || []).filter((u) => !u.banned && !parts.some((p) => p.userId === u.id));

  const addMember = (id) => { const u = (users || []).find((x) => x.id === id); if (!u) return; setParts((pr) => [...pr, { key: u.id, userId: u.id, guestName: null, name: u.name, isWinner: false, score: "" }]); };
  const addGuestNamed = (n) => {
    const nm = (n || "").trim();
    if (!nm) return;
    if (parts.some((p) => !p.userId && (p.name || "").toLowerCase() === nm.toLowerCase())) return; // deja a table
    setParts((pr) => [...pr, { key: "g" + Date.now() + Math.random(), userId: null, guestName: nm, name: nm, isWinner: false, score: "" }]);
  };
  const addGuest = () => { const n = guestName.trim(); if (!n) return; addGuestNamed(n); setGuestName(""); };
  // Invités du carnet qui ne sont pas déjà à la table.
  const guestBookFree = (householdGuests || []).filter(
    (g) => !parts.some((p) => !p.userId && (p.name || "").toLowerCase() === g.name.toLowerCase())
  );
  // Invités saisis à la main que l'on peut proposer de garder dans le carnet.
  const guestsToKeep = parts.filter(
    (p) => !p.userId && p.name && !(householdGuests || []).some((g) => g.name.toLowerCase() === (p.name || "").toLowerCase())
  );
  const toggleWin = (key) => { setWinnersTouched(true); setParts((pr) => pr.map((p) => (p.key === key ? { ...p, isWinner: !p.isWinner } : p))); };
  // Un score saisi se reporte a l'identique sur les coequipiers : une equipe
  // marque des points ensemble, on ne les additionne pas.
  const setScore = (key, v) => setParts((pr) => {
    const src = pr.find((p) => p.key === key);
    const t = src && src.team != null ? src.team : null;
    return pr.map((p) => ((p.key === key || (t != null && p.team === t)) ? { ...p, score: v } : p));
  });
  const setTeam = (key, team) => setParts((pr) => {
    const mate = team == null ? null : pr.find((p) => p.key !== key && p.team === team && String(p.score ?? "").trim() !== "");
    return pr.map((p) => (p.key === key ? { ...p, team, score: mate ? mate.score : p.score } : p));
  });
  const removeP = (key) => setParts((pr) => pr.filter((p) => p.key !== key));
  const teamsUsed = [...new Set(parts.map((p) => p.team).filter((x) => x != null))].sort((a, b) => a - b);
  const nextTeam = (() => { for (let i = 0; i < 8; i++) if (!teamsUsed.includes(i)) return i; return null; })();
  const teamChoices = nextTeam == null ? teamsUsed : [...teamsUsed, nextTeam];
  const TEAM_L = ["A", "B", "C", "D", "E", "F", "G", "H"];
  const TEAM_HEX = [C.teal, C.amber, C.purple, C.red, "#2F6FB3", "#3B9B5B", "#D96BA0", "#8A5A2B"];

  // Le sens du score suit la fiche du jeu choisi (par défaut : le plus grand gagne).
  const selectedGame = useMemo(() => (games || []).find((g) => g.id === gameId) || null, [games, gameId]);
  useEffect(() => {
    setScoreDir(selectedGame?.scoreDirection === "low" ? "low" : "high");
    setWinnersTouched(false);
  }, [selectedGame?.id, selectedGame?.scoreDirection]); // eslint-disable-line

  const hasScore = (p) => String(p.score ?? "").trim() !== "" && Number.isFinite(Number(p.score));
  const anyScore = parts.some(hasScore);
  // Clé stable : évite de recalculer le vainqueur à chaque frappe inutile.
  const scoreKey = parts.map((p) => `${p.key}:${p.score ?? ""}`).join("|");
  const autoWinnerKeys = useMemo(() => {
    const scored = parts.filter(hasScore).map((p) => ({ key: p.key, v: Number(p.score) }));
    if (!scored.length) return [];
    const vals = scored.map((x) => x.v);
    const best = scoreDir === "low" ? Math.min(...vals) : Math.max(...vals);
    return scored.filter((x) => x.v === best).map((x) => x.key);
  }, [scoreKey, scoreDir]); // eslint-disable-line

  // Pré-sélection du vainqueur d'après les scores, tant qu'on n'a pas choisi à la main.
  useEffect(() => {
    if (!anyScore || winnersTouched) return;
    setParts((pr) => {
      const next = pr.map((p) => ({ ...p, isWinner: autoWinnerKeys.includes(p.key) }));
      return next.some((p, i) => p.isWinner !== pr[i].isWinner) ? next : pr;
    });
  }, [autoWinnerKeys, anyScore, winnersTouched]);

  const changeScoreDir = (d) => { setScoreDir(d); setWinnersTouched(false); };

  const save = async () => {
    if (!gameId) return setToast("Choisissez un jeu.");
    if (!parts.length) return setToast("Ajoutez au moins un joueur.");
    setBusy(true);
    // Le sens du score est mémorisé sur la fiche du jeu, comme depuis le chrono.
    const dirChanged = anyScore && selectedGame && (selectedGame.scoreDirection || null) !== scoreDir;
    if (dirChanged) {
      try { await supabase.rpc("set_game_score_direction", { p_game_id: gameId, p_direction: scoreDir }); } catch (e) { /* non bloquant */ }
    }
    const res = await recordManualPlay(gameId, new Date(date + "T12:00:00").toISOString(), parts);
    if (dirChanged) await reload();
    setBusy(false);
    if (res?.error) return setToast(res.error);
    setToast("Partie enregistrée !");
    // On ne referme plus tout de suite : bien souvent une partie en appelle une
    // autre, et tout ressaisir (joueurs, équipes, jeu) était fastidieux.
    setJustSaved({ gameName: selectedGame?.name || "cette partie", count: (justSaved?.count || 0) + 1 });
  };

  // Repartir pour une partie, avec les mêmes joueurs et les mêmes équipes.
  // Seuls les scores et les vainqueurs sont remis à zéro : c'est ce qui change
  // d'une partie à l'autre, le reste ne bouge pas.
  const again = (keepGame) => {
    setParts((pr) => pr.map((p) => ({ ...p, isWinner: false, score: "" })));
    setWinnersTouched(false);
    setScorePadFor(null);
    setJustSaved(null);
    if (!keepGame) { setGameId(""); setGameSearch(""); setGameListOpen(true); }
  };

  if (justSaved) {
    const winners = parts.filter((p) => p.isWinner);
    return (
      <Modal open={open} onClose={onClose} title="Partie enregistrée" width={540}>
        <div style={{ textAlign: "center", padding: "8px 0 20px" }}>
          <div style={{ width: 62, height: 62, borderRadius: 20, background: "rgba(30,138,138,.13)", display: "grid", placeItems: "center", margin: "0 auto 14px" }}>
            <Check size={32} color={C.teal} />
          </div>
          <div style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 700, color: C.navy, fontSize: 20 }}>
            {justSaved.gameName} · c'est enregistré
          </div>
          <div style={{ fontSize: 13.5, color: "#8a7c6a", marginTop: 5, lineHeight: 1.55 }}>
            {winners.length > 0
              ? <>Bravo à <b style={{ color: C.amber }}>{winners.map((w) => w.name).join(", ")}</b>.</>
              : "Aucun vainqueur déclaré — partie coopérative ou match nul."}
            {justSaved.count > 1 && <span style={{ display: "block", marginTop: 3 }}>{justSaved.count} parties enregistrées d'affilée.</span>}
          </div>
        </div>

        <div style={{ background: "rgba(30,138,138,.06)", border: `1px solid ${C.teal}33`, borderRadius: 14, padding: "13px 15px", marginBottom: 14 }}>
          <div style={{ fontSize: 13, color: "#6e6256", marginBottom: 11, lineHeight: 1.5 }}>
            On enchaîne ? Les <b>{parts.length} joueur{parts.length > 1 ? "s" : ""}</b>{teamsOn ? " et les équipes" : ""} sont conservés — vous pourrez toujours les modifier ensuite.
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr)", gap: 8 }}>
            <Btn full variant="teal" onClick={() => again(true)}>
              <RotateCcw size={16} /> Une autre partie de {justSaved.gameName}
            </Btn>
            <Btn full variant="soft" onClick={() => again(false)}>
              <Gamepad2 size={16} /> Mêmes joueurs, autre jeu
            </Btn>
          </div>
        </div>

        {guestsToKeep.length > 0 && (
          <div style={{ background: "rgba(107,58,122,.07)", border: `1px solid ${C.purple}33`, borderRadius: 14, padding: "13px 15px", marginBottom: 14 }}>
            <div style={{ fontSize: 13, color: "#6e6256", marginBottom: 10, lineHeight: 1.5 }}>
              <b>Ces invités reviendront ?</b> Gardez-les dans le carnet de votre foyer : ils seront proposés d'un clic la prochaine fois.
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {guestsToKeep.map((p) => (
                <button key={p.key} type="button"
                  onClick={async () => { const r = await addHouseholdGuest(p.name); setToast(r?.error || `${p.name} ajouté à vos invités.`); }}
                  style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "#fff", border: `1.5px solid ${C.purple}55`, color: C.purple, borderRadius: 999, padding: "6px 13px", cursor: "pointer", fontFamily: "'Nunito',sans-serif", fontSize: 13.5, fontWeight: 700 }}>
                  <Plus size={13} /> Garder {p.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <Btn full variant="ghost" onClick={onClose}>Terminé pour aujourd'hui</Btn>
      </Modal>
    );
  }

  return (
    <Modal open={open} onClose={onClose} title="Enregistrer une partie" width={540}>
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr)", gap: 15 }}>
        <p style={{ margin: 0, fontSize: 13, color: "#6e6256" }}>Pour une partie non chronométrée : aucune durée n'est enregistrée, seuls le résultat et les points le sont. Les scores sont facultatifs — laisse les cases vides si tu ne les as pas.</p>
        <label style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr)", gap: 5 }}>
          <span style={{ fontWeight: 700, fontSize: 13.5, color: C.navy }}>Jeu</span>
          <div style={{ position: "relative" }}>
            <input
              value={gameSearch}
              onChange={(e) => { setGameSearch(e.target.value); setGameId(""); setGameListOpen(true); }}
              onFocus={() => setGameListOpen(true)}
              onBlur={() => setTimeout(() => setGameListOpen(false), 150)}
              placeholder="Tape le nom d'un jeu ou parcours la liste…"
              style={fieldStyle}
            />
            {gameListOpen && (
              <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, maxHeight: 230, overflowY: "auto", background: "#fff", border: "1.5px solid #e6dcc9", borderRadius: 10, zIndex: 40, boxShadow: "0 8px 24px rgba(0,0,0,.14)" }}>
                {filteredGames.length === 0 && <div style={{ padding: "10px 12px", color: "#9c8d79", fontSize: 13.5 }}>Aucun jeu trouvé.</div>}
                {filteredGames.map((g) => (
                  <button key={g.id} type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => { setGameId(g.id); setGameSearch(g.name); setGameListOpen(false); }}
                    style={{ display: "block", width: "100%", textAlign: "left", padding: "8px 12px", border: "none", borderBottom: "1px solid #f4ecda", background: gameId === g.id ? "rgba(30,138,138,.12)" : "#fff", cursor: "pointer", fontSize: 14, color: C.navy, fontFamily: "'Nunito',sans-serif" }}>
                    {g.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </label>
        <label style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr)", gap: 5 }}>
          <span style={{ fontWeight: 700, fontSize: 13.5, color: C.navy }}>Date de la partie</span>
          <input type="date" value={date} max={new Date().toISOString().slice(0, 10)} onChange={(e) => setDate(e.target.value)} style={fieldStyle} />
        </label>
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr)", gap: 8 }}>
          <span style={{ fontWeight: 700, fontSize: 13.5, color: C.navy }}>Joueurs <span style={{ fontWeight: 400, color: "#9c8d79" }}>— touche «&nbsp;pts&nbsp;» pour le pavé de score, sinon appuie sur 🏆</span></span>
          {parts.length === 0 && <span style={{ fontSize: 13, color: "#9c8d79" }}>Aucun joueur pour l'instant.</span>}
          {parts.map((p) => (
            <div key={p.key} style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0, flexWrap: "wrap", background: p.isWinner ? "rgba(232,163,23,.12)" : "#FBF7EF", border: `1px solid ${p.isWinner ? C.amber : "#ece2d0"}`, borderLeft: teamsOn && p.team != null ? `5px solid ${TEAM_HEX[p.team % TEAM_HEX.length]}` : `1px solid ${p.isWinner ? C.amber : "#ece2d0"}`, borderRadius: 10, padding: "7px 10px" }}>
              <span style={{ flex: 1, minWidth: 90, fontWeight: 600, color: C.navy, fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}{p.userId ? "" : " · invité"}</span>
              {teamsOn && (
                <span style={{ display: "inline-flex", gap: 4, flexShrink: 0 }}>
                  <button type="button" onClick={() => setTeam(p.key, null)} title="Joue pour lui-même"
                    style={{ padding: "4px 8px", borderRadius: 7, cursor: "pointer", fontFamily: "'Fredoka',sans-serif", fontWeight: 700, fontSize: 12,
                      border: p.team == null ? `2px solid ${C.navy}` : "1.5px solid #e6dcc9", background: p.team == null ? C.navy : "#fff", color: p.team == null ? "#fff" : "#9c8d79" }}>
                    Seul
                  </button>
                  {teamChoices.map((n) => (
                    <button key={n} type="button" onClick={() => setTeam(p.key, n)} title={`Équipe ${TEAM_L[n]}`}
                      style={{ width: 28, padding: "4px 0", borderRadius: 7, cursor: "pointer", fontFamily: "'Fredoka',sans-serif", fontWeight: 700, fontSize: 12.5,
                        border: p.team === n ? `2px solid ${TEAM_HEX[n % TEAM_HEX.length]}` : "1.5px solid #e6dcc9",
                        background: p.team === n ? TEAM_HEX[n % TEAM_HEX.length] : "#fff", color: p.team === n ? "#fff" : "#9c8d79" }}>
                      {TEAM_L[n]}
                    </button>
                  ))}
                </span>
              )}
              <span style={{ display: "inline-flex", alignItems: "stretch", flexShrink: 0, borderRadius: 8, overflow: "hidden", border: `1.5px solid ${hasScore(p) ? C.amber : "#e6dcc9"}`, background: hasScore(p) ? "#FDF4E0" : "#fff" }}>
                <button type="button" onClick={() => setScorePadFor(p.key)} title={`Noter le score de ${p.name} (facultatif)`}
                  style={{ border: "none", background: "transparent", padding: "6px 9px", minWidth: 44, cursor: "pointer", fontFamily: "'Fredoka',sans-serif", fontWeight: 700, fontSize: 13.5, color: hasScore(p) ? "#8a6a1f" : "#b6a78f" }}>
                  {hasScore(p) ? Number(p.score) : "pts"}
                </button>
                {hasScore(p) && (
                  <button type="button" onClick={() => setScore(p.key, "")} title="Effacer le score"
                    style={{ border: "none", background: "transparent", padding: "0 6px 0 0", cursor: "pointer", color: "#b08a3a", display: "grid", placeItems: "center" }}><X size={12} /></button>
                )}
              </span>
              <button onClick={() => toggleWin(p.key)} title="Vainqueur" style={{ border: "none", background: p.isWinner ? C.amber : "#eee2cf", borderRadius: 8, width: 30, height: 30, flexShrink: 0, cursor: "pointer", fontSize: 15, opacity: p.isWinner ? 1 : 0.5 }}>🏆</button>
              <button onClick={() => removeP(p.key)} title="Retirer" style={{ border: "none", background: "transparent", color: C.red, cursor: "pointer", display: "grid", placeItems: "center" }}><X size={16} /></button>
            </div>
          ))}
          {anyScore && (
            <div style={{ background: "rgba(107,58,122,.07)", border: `1.5px solid ${C.purple}33`, borderRadius: 12, padding: "11px 13px" }}>
              <div style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 700, color: C.navy, fontSize: 13.5, marginBottom: 8 }}>Quel score l'emporte ?</div>
              <div style={{ display: "flex", gap: 8 }}>
                {[{ v: "high", t: "Le plus grand", ico: TrendingUp }, { v: "low", t: "Le plus petit", ico: TrendingDown }].map((o) => {
                  const on = scoreDir === o.v;
                  const Ico = o.ico;
                  return (
                    <button key={o.v} type="button" onClick={() => changeScoreDir(o.v)} style={{
                      flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "8px 10px", borderRadius: 10, cursor: "pointer",
                      fontFamily: "'Fredoka',sans-serif", fontWeight: 600, fontSize: 13,
                      border: `2px solid ${on ? C.purple : "#e6dcc9"}`, background: on ? C.purple : "#fff", color: on ? "#fff" : "#8a7c6a",
                    }}><Ico size={14} /> {o.t}</button>
                  );
                })}
              </div>
              <div style={{ fontSize: 12, color: "#8a7c6a", marginTop: 7, lineHeight: 1.45 }}>
                Le vainqueur est déduit des points — tu peux le corriger avec 🏆.{winnersTouched ? " (choix manuel en cours)" : ""}
                {selectedGame && (selectedGame.scoreDirection || null) !== scoreDir && <> Ce choix sera enregistré sur la fiche du jeu.</>}
              </div>
            </div>
          )}
          {parts.length > 1 && (
            <label style={{ display: "flex", alignItems: "flex-start", gap: 9, padding: "10px 12px", borderRadius: 11, cursor: "pointer",
              background: teamsOn ? "rgba(30,138,138,.09)" : "rgba(26,58,92,.04)", border: `1.5px solid ${teamsOn ? C.teal : "transparent"}` }}>
              <input type="checkbox" checked={teamsOn} onChange={(ev) => { setTeamsOn(ev.target.checked); if (!ev.target.checked) setParts((pr) => pr.map((p) => ({ ...p, team: null }))); }}
                style={{ width: 17, height: 17, accentColor: C.teal, marginTop: 2, flexShrink: 0 }} />
              <span style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 600, color: C.navy, fontSize: 13.5 }}>
                👥 Partie en équipes
                <span style={{ display: "block", fontSize: 12.5, color: "#8a7c6a", fontWeight: 400, lineHeight: 1.5, marginTop: 2 }}>
                  Attribuez une lettre à chaque joueur : le score saisi pour l'un sera <b>repris à l'identique</b> pour ses coéquipiers.
                </span>
              </span>
            </label>
          )}
          {guestBookFree.length > 0 && (
            <div>
              <span style={{ display: "block", fontWeight: 700, fontSize: 13.5, color: C.navy, marginBottom: 5 }}>
                Mes invités <span style={{ fontWeight: 400, fontSize: 12.5, color: "#9c8d79" }}>· un clic pour les ajouter</span>
              </span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {guestBookFree.map((g) => (
                  <button key={g.id} type="button" onClick={() => addGuestNamed(g.name)} title={`Ajouter ${g.name} à la partie`}
                    style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "#fff", border: `1.5px solid ${C.purple}44`, color: C.navy, borderRadius: 999, padding: "5px 12px", cursor: "pointer", fontFamily: "'Nunito',sans-serif", fontSize: 13.5, fontWeight: 600 }}>
                    <Plus size={13} color={C.purple} /> {g.name}
                  </button>
                ))}
              </div>
            </div>
          )}
          <select value="" onChange={(e) => { if (e.target.value) addMember(e.target.value); }} style={fieldStyle}>
            <option value="">+ Ajouter un membre…</option>
            {available.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
          <div style={{ display: "flex", gap: 8 }}>
            <input value={guestName} onChange={(e) => setGuestName(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addGuest(); } }} placeholder="+ Ajouter un invité (nom)" style={{ ...fieldStyle, flex: 1 }} />
            <Btn size="sm" variant="soft" onClick={addGuest}>Ajouter</Btn>
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 4 }}>
          <Btn variant="ghost" onClick={onClose}>Annuler</Btn>
          <Btn variant="primary" onClick={save} disabled={busy}>{busy ? "Enregistrement…" : "Enregistrer"}</Btn>
        </div>
      </div>
      {scorePadFor && (() => {
        const p = parts.find((x) => x.key === scorePadFor);
        return p ? (
          <ScorePadOverlay key={p.key} name={p.name + (teamsOn && p.team != null ? ` · équipe ${TEAM_L[p.team]}` : "")} initialScore={Number(p.score) || 0}
            onClose={() => setScorePadFor(null)}
            onApply={(v) => { setScore(p.key, String(v)); setScorePadFor(null); }} />
        ) : null;
      })()}
    </Modal>
  );
}

/* Fenetre « Pourquoi l'ecarter ? » -- un seul ecran, un seul tap.
   Deux ecrans successifs par croix, c'est de la friction : les membres
   fermeraient sans repondre, et l'on n'apprendrait rien. */
function RecoFeedbackModal({ game, onClose, onPick }) {
  return (
    <Modal open onClose={onClose} title="Pourquoi l'écarter ?" width={520}>
      <p style={{ margin: "0 0 14px", fontSize: 13.5, color: "#8a7c6a", lineHeight: 1.55 }}>
        <b style={{ color: C.navy }}>{game.name}</b> va disparaître de vos suggestions.
        Votre réponse décide de ce que le site en retient — et reste privée.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr)", gap: 8 }}>
        {RECO_REASONS.map((r) => (
          <button key={r.key} type="button" onClick={() => onPick(r)}
            style={{ textAlign: "left", padding: "11px 14px", borderRadius: 12, cursor: "pointer",
              border: "1.5px solid #e6dcc9", background: "#fff", font: "inherit", minWidth: 0 }}>
            <span style={{ display: "block", fontFamily: "'Fredoka',sans-serif", fontWeight: 600, color: C.navy, fontSize: 14.5 }}>{r.label}</span>
            <span style={{ display: "block", fontSize: 12, color: "#9c8d79", marginTop: 2, lineHeight: 1.4 }}>{r.hint}</span>
          </button>
        ))}
      </div>
    </Modal>
  );
}

/* Fenetre « Suggestions masquees » -- indispensable : dans une ludotheque
   finie, un membre assidu vide son vivier en quelques mois et n'a plus aucune
   suggestion, sans comprendre pourquoi. Il faut pouvoir revenir en arriere. */
function HiddenRecosModal({ rows, games, onClose, onRestore }) {
  const nameOf = (id) => (games || []).find((g) => g.id === id)?.name || "Jeu retiré";
  const sorted = [...rows].sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
  return (
    <Modal open onClose={onClose} title="Suggestions masquées" width={560}>
      <p style={{ margin: "0 0 14px", fontSize: 13.5, color: "#8a7c6a", lineHeight: 1.55 }}>
        Ces jeux ne vous sont plus proposés. Les réafficher les remet dans le circuit
        et efface ce que le moteur en avait retenu.
      </p>
      {sorted.length === 0 ? (
        <EmptyHint icon={Sparkles} text="Aucune suggestion masquée." />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr)", gap: 8 }}>
          {sorted.map((d) => (
            <div key={d.gameId} style={{ display: "flex", alignItems: "center", gap: 12, background: "rgba(26,58,92,.04)", borderRadius: 11, padding: "9px 13px" }}>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: "block", fontFamily: "'Fredoka',sans-serif", fontWeight: 600, color: C.navy, fontSize: 14.5, overflowWrap: "anywhere" }}>{nameOf(d.gameId)}</span>
                <span style={{ display: "block", fontSize: 12, color: "#9c8d79", marginTop: 1 }}>
                  {RECO_REASON_LABEL(d.reason)}
                  {d.snoozeUntil ? ` · revient le ${new Date(d.snoozeUntil).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}` : ""}
                </span>
              </span>
              <Btn size="sm" variant="soft" onClick={() => onRestore(d.gameId)}>Réafficher</Btn>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}

function MyLudoPage({ setToast, setPage }) {
  const { games, currentUser, users, household, events, setShareLibrary, toggleGameShared, confirmOwnership, declineOwnership, confirmExtensionOwnership, removeExtensionOwner, confirmEventInvite, declineEventInvite, dismissedRecos, dismissReco, restoreReco, toggleDiscover, notifications, markNotificationRead, markAllNotificationsRead, deleteNotification, pushSupported, pushEnabled, enablePush, disablePush, setRetroEmails, askConfirm, personalReady } = useApp();
  const [recordOpen, setRecordOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [viewSelf, setViewSelf] = useState(false); // voir sa fiche publique telle que les autres la voient
  const [statPanel, setStatPanel] = useState(null); // "ext" | "rated" | "status" — fenetre ouverte depuis les tuiles
  const [recoFeedback, setRecoFeedback] = useState(null); // jeu dont on demande le motif de rejet
  const [showHiddenRecos, setShowHiddenRecos] = useState(false);
  const ludoAnchorRef = useRef(null);               // ancre « Ma ludotheque » (bas de page)
  const [showAdd, setShowAdd] = useState(false);
  const [q, setQ] = useState("");
  const [mech, setMech] = useState("");
  const [players, setPlayers] = useState("");
  const [duration, setDuration] = useState("");
  const [year, setYear] = useState("");
  const [wantFilter, setWantFilter] = useState("");
  const [sort, setSort] = useState("alpha");
  const [view, setView] = useState("grid"); // "grid" | "list"
  // Le tri « Mes meilleures notes » compare forcement ma note a celle de l'association :
  // les deux notes sont alors affichees d'office sur les vignettes.
  const bothAuto = !!currentUser && sort === "myNote";
  const [showBoth, setShowBoth] = useState(false); // afficher moyenne + ma note simultanément sur les cartes

  // Possessions en attente : jeux où je suis listé comme propriétaire mais avec confirmed=false.
  // J'ai besoin de confirmer ou de refuser ces déclarations.
  const myPending = useMemo(
    () => games.filter((g) => (g.pendingOwners || []).some((o) => o.id === currentUser?.id)),
    [games, currentUser]
  );
  // Extensions déclarées à mon nom par un autre membre, en attente de ma confirmation.
  const myPendingExt = useMemo(() => {
    const out = [];
    (games || []).forEach((g) => (g.extensions || []).forEach((x) => {
      if ((x.pendingOwners || []).some((o) => o.id === currentUser?.id)) out.push({ ext: x, gameName: g.name });
    }));
    return out;
  }, [games, currentUser]);

  const householdIds = useMemo(() => {
    const ids = household?.memberIds || [];
    return ids.length ? ids : (currentUser ? [currentUser.id] : []);
  }, [household, currentUser]);
  const nameById = useMemo(() => Object.fromEntries((users || []).map((u) => [u.id, u.name])), [users]);
  // Étiquette du propriétaire réel d'un jeu du foyer (null si le jeu est aussi à moi)
  const familyOwnerLabel = useCallback((g) => {
    if (!(household?.memberIds || []).length) return null;
    if ((g.ownerIds || []).includes(currentUser?.id)) return null;
    const other = (g.ownerIds || []).find((id) => householdIds.includes(id));
    return other ? (nameById[other] || "un proche") : null;
  }, [household, householdIds, nameById, currentUser]);
  // Ma ludothèque = mes jeux + ceux des membres de mon foyer (union, calculée à l'affichage)
  const allMine = useMemo(() => games.filter((g) => (g.ownerIds || []).some((id) => householdIds.includes(id))), [games, householdIds]);
  const [inviteBusy, setInviteBusy] = useState(false);
  // Invitations à des moments jeux : lignes event_guests où je suis le membre concerné (en attente)
  const myEventInvites = useMemo(() => {
    if (!currentUser) return [];
    const out = [];
    (events || []).forEach((e) => (e.guests || []).forEach((g) => { if (g.memberId === currentUser.id) out.push({ ev: e, guest: g }); }));
    return out.sort((a, b) => (a.ev.date || "").localeCompare(b.ev.date || ""));
  }, [events, currentUser]);
  const runInvite = async (fn, ok) => {
    setInviteBusy(true);
    const r = await fn();
    setInviteBusy(false);
    if (r?.error) setToast(r.error);
    else if (ok) setToast(ok);
  };
  // Nombre d'extensions que le membre possède (à travers tous les jeux de l'association)
  const myExtCount = useMemo(() => {
    let n = 0;
    games.forEach((g) => (g.extensions || []).forEach((x) => { if ((x.ownerIds || []).some((id) => householdIds.includes(id))) n++; }));
    return n;
  }, [games, householdIds]);
  const myMechanics = useMemo(() => {
    const s = new Set();
    allMine.forEach((g) => (g.mechanics || []).forEach((m) => s.add(m)));
    return [...s].sort((a, b) => a.localeCompare(b, "fr"));
  }, [allMine]);

  // Années présentes dans ma ludothèque + flag pour les jeux sans année
  const { allYears: myYears, hasNoYear: myHasNoYear } = useMemo(() => {
    const s = new Set();
    let none = false;
    allMine.forEach((g) => {
      const y = Number(g.year) || 0;
      if (y > 0) s.add(y);
      else none = true;
    });
    return { allYears: [...s].sort((a, b) => b - a), hasNoYear: none };
  }, [allMine]);

  const mine = useMemo(() => {
    let list = allMine.filter((g) => {
      const okQ = !q || g.name.toLowerCase().includes(q.toLowerCase());
      const okM = !mech || (g.mechanics || []).includes(mech);
      let okP = true;
      if (players) {
        const want = Number(players);
        const min = Number(g.min) || 1;
        const max = g.max ? Number(g.max) : Infinity;
        okP = (players === "7") ? max >= 7 : (want >= min && want <= max);
      }
      let okD = true;
      if (duration) {
        const t = Number(g.time) || 0;
        if (duration === "121") okD = t > 120;
        else okD = t > 0 && t <= Number(duration);
      }
      let okY = true;
      if (year) {
        const y = Number(g.year) || 0;
        if (year === "none") okY = !g.year || y === 0;
        else okY = y === Number(year);
      }
      let okW = true;
      if (wantFilter) {
        const wantIds = g.wantIds || [];
        if (wantFilter === "mine") okW = currentUser && wantIds.includes(currentUser.id);
        else if (wantFilter === "any") okW = wantIds.length > 0;
        else if (wantFilter === "none") okW = wantIds.length === 0;
      }
      return okQ && okM && okP && okD && okY && okW;
    });
    if (sort === "alpha") list = [...list].sort((a, b) => a.name.localeCompare(b.name, "fr"));
    else if (sort === "note") list = rankGames(list); // note générale
    else if (sort === "myNote") list = [...list].sort((a, b) => (b.ratings?.[currentUser?.id] || 0) - (a.ratings?.[currentUser?.id] || 0));
    else if (sort === "recent") list = [...list].sort((a, b) => (b.addedAt || 0) - (a.addedAt || 0));
    else if (sort === "wants") list = [...list].sort((a, b) => (b.wantIds?.length || 0) - (a.wantIds?.length || 0));
    return list;
  }, [allMine, q, mech, players, duration, year, wantFilter, sort, currentUser]);

  const myRatingsCount = useMemo(() => games.filter((g) => g.ratings?.[currentUser?.id]).length, [games, currentUser]);
  // Detail des extensions du foyer (pour la fenetre ouverte depuis la tuile « extensions »)
  const myExtList = useMemo(() => {
    const out = [];
    games.forEach((g) => (g.extensions || []).forEach((x) => {
      if ((x.ownerIds || []).some((id) => householdIds.includes(id))) out.push({ ext: x, game: g });
    }));
    return out.sort((a, b) => a.ext.name.localeCompare(b.ext.name, "fr"));
  }, [games, householdIds]);
  // Detail de mes jeux notes (pour la fenetre ouverte depuis la tuile « jeux notes »)
  const myRatedList = useMemo(() => {
    if (!currentUser) return [];
    return games.filter((g) => g.ratings?.[currentUser.id])
      .map((g) => ({ game: g, note: g.ratings[currentUser.id] }))
      .sort((a, b) => (b.note - a.note) || a.game.name.localeCompare(b.game.name, "fr"));
  }, [games, currentUser]);
  const scrollToLudo = () => {
    const el = ludoAnchorRef.current;
    if (el && el.scrollIntoView) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const recommendations = useMemo(() => recommendGames(games, currentUser?.id, dismissedRecos, 12), [games, currentUser, dismissedRecos]);
  // Seuls les rejets encore actifs sont proposables à la restauration.
  const hiddenRecos = useMemo(() => (dismissedRecos || []).filter((d) => isRecoDismissalActive(d)), [dismissedRecos]);

  const exportExcel = async () => {
    // Chargement à la demande de la lib XLSX (≈ 200 ko) : on ne paie pas son coût au démarrage,
    // uniquement quand l'utilisateur déclenche réellement un export.
    setToast("Préparation de l'export…");
    const XLSX = await import("xlsx");
    const wb = XLSX.utils.book_new();

    // Les descriptions ne sont pas chargées dans le listing (allègement Egress).
    // On les récupère ici, uniquement pour mes jeux, juste avant l'export.
    const descById = {};
    try {
      const ids = allMine.map((g) => g.id);
      if (ids.length > 0) {
        const { data: descRows } = await supabase.from("games").select("id,description").in("id", ids);
        (descRows || []).forEach((r) => { descById[r.id] = r.description || ""; });
      }
    } catch (e) { /* en cas d'échec, on exporte sans les descriptions */ }

    // Feuille 1 : ma ludothèque détaillée
    const rows = allMine.map((g) => {
      const { avg, count } = gameStats(g);
      return {
        "Jeu": g.name,
        "Année": g.year || "",
        "Joueurs min": g.min || "",
        "Joueurs max": g.max || "",
        "Durée (min)": g.time || "",
        "Mécaniques": (g.mechanics || []).join(", "),
        "Note moyenne asso": count ? avg.toFixed(2) : "",
        "Nombre de votes": count,
        "Ma note": g.ratings?.[currentUser.id] || "",
        "Source": g.source || "manuel",
        "Présentation": (descById[g.id] || g.desc || "").replace(/\n/g, " "),
        "Image": g.img || "",
        "Ajouté le": g.addedAt ? new Date(g.addedAt).toLocaleDateString("fr-FR") : "",
      };
    });
    const ws1 = XLSX.utils.json_to_sheet(rows);
    ws1["!cols"] = [{ wch: 30 }, { wch: 7 }, { wch: 11 }, { wch: 11 }, { wch: 11 }, { wch: 30 }, { wch: 16 }, { wch: 14 }, { wch: 9 }, { wch: 14 }, { wch: 60 }, { wch: 40 }, { wch: 12 }];
    XLSX.utils.book_append_sheet(wb, ws1, "Ma ludothèque");

    // Feuille 2 : toutes mes notes (sur toute la ludo de l'asso)
    const noteRows = games.filter((g) => g.ratings?.[currentUser.id]).map((g) => ({
      "Jeu": g.name, "Propriétaire": g.ownerName, "Ma note": g.ratings[currentUser.id], "Note moyenne asso": gameStats(g).avg.toFixed(2),
    }));
    const ws2 = XLSX.utils.json_to_sheet(noteRows.length ? noteRows : [{ "Jeu": "—", "Propriétaire": "", "Ma note": "", "Note moyenne asso": "" }]);
    ws2["!cols"] = [{ wch: 30 }, { wch: 16 }, { wch: 9 }, { wch: 18 }];
    XLSX.utils.book_append_sheet(wb, ws2, "Mes notes");

    // Feuille 3 : récapitulatif
    const ws3 = XLSX.utils.json_to_sheet([
      { "Information": "Membre", "Valeur": currentUser.name },
      { "Information": "Statut", "Valeur": currentUser.role === "decideur" ? "Décisionnaire" : "Non décisionnaire" },
      { "Information": "Jeux dans ma ludothèque", "Valeur": mine.length },
      { "Information": "Jeux notés", "Valeur": myRatingsCount },
      { "Information": "Export généré le", "Valeur": new Date().toLocaleString("fr-FR") },
    ]);
    ws3["!cols"] = [{ wch: 28 }, { wch: 28 }];
    XLSX.utils.book_append_sheet(wb, ws3, "Récapitulatif");

    XLSX.writeFile(wb, `ludotheque-${slug(currentUser.name)}-aladj.xlsx`);
    setToast("Export Excel téléchargé !");
  };

  return (
    <div style={{ maxWidth: 1180, margin: "0 auto", padding: "40px 24px 80px" }}>
      <MembershipBanner setToast={setToast} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 14, marginBottom: 26 }}>
        <div>
          <span style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 700, color: C.teal, fontSize: 13, textTransform: "uppercase", letterSpacing: "0.12em" }}>Espace membre</span>
          <h1 style={{ fontFamily: "'Fredoka',sans-serif", color: C.navy, fontSize: "clamp(30px,5vw,44px)", margin: "4px 0 0", letterSpacing: "-0.02em" }}>Mon espace</h1>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Btn variant="ghost" onClick={() => setViewSelf(true)}><Eye size={17} /> Voir ma fiche</Btn>
          <Btn variant="ghost" onClick={exportExcel} disabled={mine.length === 0}><Download size={17} /> Export Excel</Btn>
          <Btn variant="amber" onClick={() => setShowAdd(true)}><Plus size={17} /> Ajouter un jeu</Btn>
        </div>
      </div>

      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 20 }}>
        <StatCard icon={Library} color={C.teal} n={mine.length} label="jeux apportés" onClick={scrollToLudo} title="Aller à ma ludothèque" />
        <StatCard icon={Package} color={C.red} n={myExtCount} label={myExtCount > 1 ? "extensions" : "extension"} onClick={() => setStatPanel("ext")} title="Voir la liste de mes extensions" />
        <StatCard icon={Star} color={C.amber} n={myRatingsCount} label="jeux notés" onClick={() => setStatPanel("rated")} title="Voir la liste de mes jeux notés" />
        <StatCard icon={currentUser.role === "decideur" ? Crown : Heart} color={C.purple} n={currentUser.role === "decideur" ? "Décisionnaire" : "Membre"} label="statut" small onClick={() => setStatPanel("status")} title="Ce que permet mon statut" />
      </div>

      {myEventInvites.length > 0 && (
        <div style={{ background: "rgba(232,163,23,.08)", border: `2px solid ${C.amber}`, borderRadius: 16, padding: "16px 20px", marginBottom: 22 }}>
          <h3 style={{ fontFamily: "'Fredoka',sans-serif", color: C.navy, fontSize: 17, margin: "0 0 6px", display: "flex", alignItems: "center", gap: 8 }}>
            <Calendar size={18} color={C.amber} /> Mes invitations aux moments
          </h3>
          <p style={{ fontSize: 12.5, color: "#6e6256", margin: "0 0 12px", lineHeight: 1.5 }}>
            On vous a ajouté à ces moments jeux. Confirmez votre venue pour apparaître comme participant (sinon vous restez affiché « en attente »).
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr)", gap: 8 }}>
            {myEventInvites.map(({ ev, guest }) => (
              <div key={guest.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 11, background: "#fff", border: `1px solid ${C.amber}`, flexWrap: "wrap" }}>
                <Calendar size={16} color={C.amber} style={{ flexShrink: 0 }} />
                <span style={{ flex: 1, minWidth: 150, fontSize: 13.5, color: "#5e5346" }}>
                  Moment du <strong>{formatDateFr(ev.date)}</strong> à {ev.time}{ev.online ? " (en ligne)" : (ev.place ? ` — ${ev.place}` : "")}
                </span>
                <Btn size="sm" variant="teal" disabled={inviteBusy} onClick={() => runInvite(() => confirmEventInvite(guest.id), "Participation confirmée !")}><Check size={15} /> Je viens</Btn>
                <Btn size="sm" variant="soft" disabled={inviteBusy} onClick={() => runInvite(() => declineEventInvite(guest.id))}><X size={15} /> Décliner</Btn>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notifications récentes (commentaires, envies de découverte sur mes jeux/moments) */}
      {notifications.length > 0 && (() => {
        const unreadCount = personalReady ? notifications.filter((n) => !n.read).length : 0;
        const shown = notifications.slice(0, 12); // on affiche les 12 plus récentes
        const iconFor = (t) => t === "game_comment" ? PenLine : (t === "poll_open" || t === "poll_closed") ? Crown : (t === "idea_new" || t === "idea_comment") ? Sparkles : t === "poll_comment" ? MessageCircle : (t === "event_comment" || t === "event_invite" || t === "event_join") ? Calendar : t === "discovery" ? Heart : t === "play_recorded" ? Gamepad2 : (t === "household_invite" || t === "household_accepted" || t === "household_declined") ? Users : (t === "quorum_reached" || t === "quorum_lost") ? Users : Info;
        return (
          <div style={{ background: "rgba(30,138,138,.07)", border: `2px solid ${C.teal}`, borderRadius: 16, padding: "16px 20px", marginBottom: 22 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
              <h3 style={{ fontFamily: "'Fredoka',sans-serif", color: C.navy, fontSize: 17, margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
                <Sparkles size={18} color={C.teal} /> Notifications
                {unreadCount > 0 && <span style={{ background: C.red, color: "#fff", borderRadius: 999, fontSize: 12, padding: "1px 9px", fontWeight: 700 }}>{unreadCount}</span>}
              </h3>
              {unreadCount > 0 && <Btn size="sm" variant="soft" onClick={() => markAllNotificationsRead()}>Tout marquer comme lu</Btn>}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr)", gap: 8 }}>
              {shown.map((n) => {
                const Icon = iconFor(n.type);
                return (
                  <div key={n.id} role="button" tabIndex={0} onClick={() => {
                    markNotificationRead(n.id);
                    if (n.linkKind === "game" && n.linkId) setSelected(n.linkId);
                    else if (n.linkKind === "poll" || n.linkKind === "idea") setPage("decideur");
                    else if (n.linkKind === "event") setPage("soirees");
                  }} style={{
                    display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 11, textAlign: "left", cursor: "pointer",
                    background: n.read ? "#fff" : "rgba(30,138,138,.1)", border: n.read ? "1px solid #ece2d0" : `1px solid ${C.teal}`,
                  }}>
                    <span style={{ width: 32, height: 32, borderRadius: 9, flexShrink: 0, background: n.read ? "#f0e8d8" : "rgba(30,138,138,.18)", display: "grid", placeItems: "center" }}>
                      <Icon size={15} color={n.read ? "#9c8d79" : C.teal} />
                    </span>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: "block", fontSize: 13.5, color: "#5e5346", lineHeight: 1.4 }}>{n.message}</span>
                      <span style={{ display: "block", fontSize: 11, color: "#a89a86", marginTop: 1 }}>{timeAgoFr(n.createdAt)}</span>
                    </span>
                    <span style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                      {!n.read && <span style={{ width: 8, height: 8, borderRadius: "50%", background: C.red }} />}
                      <button title="Supprimer cette notification" onClick={(e) => { e.stopPropagation(); deleteNotification(n.id); }}
                        style={{ background: "none", border: "none", padding: 4, cursor: "pointer", color: "#a89a86", display: "grid", placeItems: "center", borderRadius: 6 }}>
                        <X size={15} />
                      </button>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      <div style={{ display: "flex", justifyContent: "center", marginBottom: 22 }}>
        <Btn variant="primary" onClick={() => setRecordOpen(true)}>🎲 Enregistrer une partie jouée</Btn>
      </div>
      <RecordPlayModal open={recordOpen} onClose={() => setRecordOpen(false)} setToast={setToast} />
      <EventPlaySuggestions />
      <MyPlaysSection setToast={setToast} />
      <MyBadgesSection setToast={setToast} />
      <MyRetroSection />
      <AdminBackupSection />
      <AdminMechanicsSection setToast={setToast} />

      <FamilySection setToast={setToast} />

      {pushSupported && (
        <div style={{ background: "rgba(232,163,23,.08)", border: `2px solid ${C.amber}`, borderRadius: 16, padding: "14px 20px", marginBottom: 22, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 22 }}>🔔</span>
            <div>
              <div style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 600, color: C.navy }}>Notifications sur cet appareil</div>
              <div style={{ fontSize: 13, color: "#6e6256" }}>{pushEnabled ? "Activées — tu seras prévenu même quand le site est fermé." : "Reçois une alerte quand on te commente, t'invite, ou qu'un moment est créé."}</div>
            </div>
          </div>
          <Btn size="sm" variant={pushEnabled ? "soft" : "amber"} onClick={async () => {
            const res = pushEnabled ? await disablePush() : await enablePush();
            if (res?.error) setToast(res.error);
            else setToast(pushEnabled ? "Notifications désactivées sur cet appareil." : "Notifications activées sur cet appareil !");
          }}>{pushEnabled ? "Désactiver" : "Activer"}</Btn>
        </div>
      )}

      {/* Rétrospective par e-mail */}
      <div style={{ background: C.paper, border: "1px solid #ece2d0", borderRadius: 16, padding: "14px 20px", marginBottom: 22, display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 230 }}>
          <span style={{ fontSize: 22 }}>💌</span>
          <div>
            <div style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 600, color: C.navy }}>Rétrospective par e-mail</div>
            <div style={{ fontSize: 13, color: "#6e6256" }}>{currentUser.retroEmails ? "Chaque début de mois, votre bilan ludique arrive par e-mail (l'annuel en janvier)." : "Vous ne recevez pas les rétrospectives par e-mail."}</div>
          </div>
        </div>
        <Btn size="sm" variant={currentUser.retroEmails ? "soft" : "amber"} onClick={async () => {
          await setRetroEmails(!currentUser.retroEmails);
          setToast(currentUser.retroEmails ? "Rétrospectives par e-mail désactivées." : "Rétrospectives par e-mail activées !");
        }}>{currentUser.retroEmails ? "Désactiver" : "Activer"}</Btn>
      </div>

      {/* Possessions à confirmer (déclarées par d'autres membres) */}
      {(myPending.length + myPendingExt.length) > 0 && (
        <div style={{ background: "rgba(232,163,23,.1)", border: `2px solid ${C.amber}`, borderRadius: 16, padding: "16px 20px", marginBottom: 22 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <Info size={18} color={C.amber} />
            <h3 style={{ fontFamily: "'Fredoka',sans-serif", color: C.navy, fontSize: 17, margin: 0 }}>
              {(() => { const n = myPending.length + myPendingExt.length; return n === 1 ? "Une possession à confirmer" : `${n} possessions à confirmer`; })()}
            </h3>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr)", gap: 10 }}>
            {myPending.map((g) => {
              const pending = (g.pendingOwners || []).find((o) => o.id === currentUser.id);
              const declarer = pending?.declaredByName || "un membre";
              return (
                <div key={g.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: "#fff", borderRadius: 11, flexWrap: "wrap" }}>
                  <div style={{ width: 40, height: 40, borderRadius: 9, flexShrink: 0, background: g.img ? `center/cover url("${g.img}")` : `linear-gradient(135deg,${C.teal},${C.purple})` }} />
                  <span style={{ flex: 1, minWidth: 200, fontSize: 13.5, color: "#5e5346" }}>
                    <b style={{ color: C.navy, fontFamily: "'Fredoka',sans-serif" }}>{declarer}</b> a indiqué que vous possédiez <b style={{ color: C.navy }}>{g.name}</b>.
                  </span>
                  <div style={{ display: "flex", gap: 6 }}>
                    <Btn size="sm" variant="teal" onClick={async () => { await confirmOwnership(g.id); setToast(`« ${g.name} » confirmé dans votre ludothèque.`); }}><Check size={14} /> Confirmer</Btn>
                    <Btn size="sm" variant="danger" onClick={async () => { if (!(await askConfirm({ title: "Refuser cette possession ?", message: "La déclaration faite en votre nom sera supprimée. Si personne d'autre ne possède ce jeu, sa fiche sera retirée de la ludothèque.", confirmLabel: "Refuser" }))) return; await declineOwnership(g.id); setToast("Possession refusée."); }}><X size={14} /> Supprimer</Btn>
                  </div>
                </div>
              );
            })}
            {myPendingExt.map(({ ext, gameName }) => (
              <div key={ext.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: "#fff", borderRadius: 11, flexWrap: "wrap" }}>
                <div style={{ width: 40, height: 40, borderRadius: 9, flexShrink: 0, background: ext.img ? `center/cover url("${ext.img}")` : `linear-gradient(135deg,${C.purple},${C.red})`, display: "grid", placeItems: "center" }}>
                  {!ext.img && <span style={{ fontSize: 15 }}>🧩</span>}
                </div>
                <span style={{ flex: 1, minWidth: 200, fontSize: 13.5, color: "#5e5346" }}>
                  Un membre a indiqué que vous possédiez l'extension <b style={{ color: C.navy }}>{ext.name}</b> <span style={{ color: "#9c8d79" }}>({gameName})</span>.
                </span>
                <div style={{ display: "flex", gap: 6 }}>
                  <Btn size="sm" variant="teal" onClick={async () => { const r = await confirmExtensionOwnership(ext.id); if (r?.error) { setToast("Erreur : " + r.error); return; } setToast(`« ${ext.name} » confirmée dans votre ludothèque.`); }}><Check size={14} /> Confirmer</Btn>
                  <Btn size="sm" variant="danger" onClick={async () => { if (!(await askConfirm({ title: "Refuser cette possession ?", message: "La déclaration faite en votre nom pour cette extension sera supprimée.", confirmLabel: "Refuser" }))) return; await removeExtensionOwner(ext.id); setToast("Possession refusée."); }}><X size={14} /> Supprimer</Btn>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Interrupteur global de partage de la ludothèque */}
      <label style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", borderRadius: 14, background: currentUser.shareLibrary !== false ? "rgba(30,138,138,.08)" : "rgba(181,40,58,.07)", border: "1px solid #ece2d0", marginBottom: 28, cursor: "pointer" }}>
        <input type="checkbox" checked={currentUser.shareLibrary !== false} onChange={(e) => setShareLibrary(e.target.checked)} style={{ width: 20, height: 20, accentColor: C.teal, flexShrink: 0 }} />
        <span>
          <span style={{ display: "block", fontFamily: "'Fredoka',sans-serif", fontWeight: 700, color: C.navy, fontSize: 15 }}>
            {currentUser.shareLibrary !== false ? "Ma ludothèque est partagée avec l'association" : "Ma ludothèque est privée"}
          </span>
          <span style={{ display: "block", fontSize: 13, color: "#8a7c6a", marginTop: 2 }}>
            {currentUser.shareLibrary !== false
              ? "Vos jeux apparaissent dans la ludothèque commune. Vous pouvez en exclure certains individuellement ci-dessous."
              : "Aucun de vos jeux n'apparaît dans la ludothèque commune, quels que soient les réglages par jeu."}
          </span>
        </span>
      </label>

      {/* Recommandations : jeux qui pourraient plaire */}
      {(recommendations.length > 0 || hiddenRecos.length > 0) && (
        <div style={{ marginBottom: 32 }}>
          <SectionTitle kicker="Suggestions" title="Des jeux qui pourraient vous plaire" noMargin />
          <p style={{ fontSize: 13.5, color: "#8a7c6a", margin: "8px 0 16px" }}>D'après vos notes, les goûts des membres proches de vous, les mécaniques et formats que vous appréciez, et les envies de découverte. Le cœur enregistre une envie de découvrir, la croix écarte le jeu en vous demandant pourquoi.</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 14 }}>
            {recommendations.map((g) => {
              const st = gameStats(g);
              return (
                <div key={g.id} style={{ position: "relative", border: "1px solid #efe6d6", borderRadius: 14, overflow: "hidden", background: "#fff" }}>
                  <button onClick={() => setSelected(g.id)} style={{ textAlign: "left", border: "none", background: "none", cursor: "pointer", padding: 0, width: "100%", display: "block" }}>
                    <GameCover g={g} />
                    <div style={{ padding: "9px 11px" }}>
                      <div style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 600, color: C.navy, fontSize: 13.5, lineHeight: 1.2 }}>{g.name}</div>
                      <div style={{ fontSize: 11.5, color: "#9c8d79", marginTop: 3 }}>chez {(g.owners && g.owners.length ? g.owners[0].name : g.ownerName)}{st.count > 0 ? ` · ★ ${st.avg.toFixed(2).replace(".", ",")}` : ""}</div>
                      {g._recoReason && (
                        <div style={{ marginTop: 6, fontSize: 10.5, color: C.teal, background: "rgba(30,138,138,.08)", borderRadius: 6, padding: "3px 7px", lineHeight: 1.3, display: "inline-block" }}>
                          {g._recoReason}
                        </div>
                      )}
                    </div>
                  </button>
                  <div style={{ position: "absolute", top: 8, right: 8, display: "flex", gap: 6 }}>
                    {/* Coeur : le seul signal POSITIF du moteur. Il enregistre une envie
                        de découvrir, qui compte aussi pour les membres proches de vous. */}
                    <button onClick={() => { toggleDiscover(g.id); setToast(`« ${g.name} » ajouté à vos envies de découverte.`); }}
                      title="J'ai envie de le découvrir"
                      style={{ width: 28, height: 28, borderRadius: "50%", border: "none", background: "rgba(18,41,63,.55)", color: "#fff", cursor: "pointer", display: "grid", placeItems: "center", backdropFilter: "blur(2px)" }}>
                      <Heart size={14} />
                    </button>
                    {/* Croix : on demande le motif avant d'écarter — « je le connais déjà »
                        ne doit surtout pas pénaliser les jeux du même genre. */}
                    <button onClick={() => setRecoFeedback(g)}
                      title="Écarter cette suggestion"
                      style={{ width: 28, height: 28, borderRadius: "50%", border: "none", background: "rgba(18,41,63,.55)", color: "#fff", cursor: "pointer", display: "grid", placeItems: "center", backdropFilter: "blur(2px)" }}>
                      <X size={15} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          {recommendations.length === 0 && (
            <p style={{ fontSize: 13.5, color: "#a89a86", margin: "4px 0 0" }}>
              Plus aucune suggestion pour l'instant — notez quelques jeux, ou réaffichez ceux que vous avez écartés.
            </p>
          )}
          {hiddenRecos.length > 0 && (
            <button type="button" onClick={() => setShowHiddenRecos(true)}
              style={{ marginTop: 14, background: "none", border: "none", color: C.teal, fontSize: 13, textDecoration: "underline", textUnderlineOffset: 2, cursor: "pointer", fontFamily: "'Nunito',sans-serif", padding: 0 }}>
              {hiddenRecos.length} suggestion{hiddenRecos.length > 1 ? "s" : ""} masquée{hiddenRecos.length > 1 ? "s" : ""} — revoir
            </button>
          )}
        </div>
      )}

      {recoFeedback && (
        <RecoFeedbackModal
          game={recoFeedback}
          onClose={() => setRecoFeedback(null)}
          onPick={async (r) => {
            const g = recoFeedback;
            setRecoFeedback(null);
            await dismissReco(g.id, r.key);
            if (r.key === "played_disliked") {
              setToast("Masqué. Une note vaut mieux qu'un rejet : la fiche s'ouvre.");
              setSelected(g.id);
            } else if (r.key === "later") {
              setToast("Mis de côté — il reviendra dans 90 jours.");
            } else {
              setToast("Suggestion masquée. Merci, ça affine les prochaines.");
            }
          }}
        />
      )}
      {showHiddenRecos && (
        <HiddenRecosModal
          rows={hiddenRecos}
          games={games}
          onClose={() => setShowHiddenRecos(false)}
          onRestore={async (gameId) => {
            await restoreReco(gameId);
            setToast("Jeu remis dans vos suggestions.");
          }}
        />
      )}

      <MyTop10Section setToast={setToast} onOpenGame={(id) => setSelected(id)} />
      {viewSelf && currentUser && <MemberLibraryModal memberId={currentUser.id} onClose={() => setViewSelf(false)} setToast={setToast} />}

      <div ref={ludoAnchorRef} style={{ margin: "34px 0 18px", scrollMarginTop: 90 }}>
        <span style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 700, color: C.teal, fontSize: 13, textTransform: "uppercase", letterSpacing: "0.12em" }}>Mes jeux</span>
        <h2 style={{ fontFamily: "'Fredoka',sans-serif", color: C.navy, fontSize: "clamp(24px,4vw,34px)", margin: "4px 0 0", letterSpacing: "-0.02em" }}>Ma ludothèque</h2>
      </div>

      {allMine.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px", background: "rgba(26,58,92,.03)", borderRadius: 20, border: "2px dashed #e0d4bf" }}>
          <Gamepad2 size={48} color="#cdb9a0" />
          <h3 style={{ fontFamily: "'Fredoka',sans-serif", color: C.navy, marginTop: 14, marginBottom: 6 }}>Votre ludothèque est vide</h3>
          <p style={{ color: "#8a7c6a", marginBottom: 20 }}>Ajoutez vos jeux : ils enrichiront la ludothèque de l'association.</p>
          <Btn variant="amber" size="lg" onClick={() => setShowAdd(true)}><Plus size={18} /> Ajouter mon premier jeu</Btn>
        </div>
      ) : (
        <>
          <RatingScaleNote />
          {/* recherche + filtres + tri */}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 20 }}>
            <div style={{ flex: 1, minWidth: 200, position: "relative" }}>
              <Search size={18} color="#b6a78f" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
              <TextInput value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher dans mes jeux..." style={{ paddingLeft: 42 }} />
            </div>
            <select value={mech} onChange={(e) => setMech(e.target.value)} style={{ ...inputStyle, width: "auto", cursor: "pointer", fontFamily: "'Fredoka',sans-serif", fontWeight: 600 }}>
              <option value="">Toutes mécaniques</option>
              {myMechanics.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
            <select value={players} onChange={(e) => setPlayers(e.target.value)} style={{ ...inputStyle, width: "auto", cursor: "pointer", fontFamily: "'Fredoka',sans-serif", fontWeight: 600 }}>
              <option value="">Tous joueurs</option>
              <option value="1">1 joueur</option><option value="2">2 joueurs</option><option value="3">3 joueurs</option>
              <option value="4">4 joueurs</option><option value="5">5 joueurs</option><option value="6">6 joueurs</option><option value="7">7+ joueurs</option>
            </select>
            <select value={duration} onChange={(e) => setDuration(e.target.value)} style={{ ...inputStyle, width: "auto", cursor: "pointer", fontFamily: "'Fredoka',sans-serif", fontWeight: 600 }}>
              <option value="">Toutes durées</option>
              <option value="30">≤ 30 min</option><option value="45">≤ 45 min</option><option value="60">≤ 1 h</option><option value="90">≤ 1 h 30</option><option value="120">≤ 2 h</option><option value="121">{"> 2 h"}</option>
            </select>
            <select value={year} onChange={(e) => setYear(e.target.value)} style={{ ...inputStyle, width: "auto", cursor: "pointer", fontFamily: "'Fredoka',sans-serif", fontWeight: 600 }}>
              <option value="">Toutes années</option>
              {myYears.map((y) => <option key={y} value={String(y)}>{y}</option>)}
              {myHasNoYear && <option value="none">Sans année renseignée</option>}
            </select>
            <select value={wantFilter} onChange={(e) => setWantFilter(e.target.value)} style={{ ...inputStyle, width: "auto", cursor: "pointer", fontFamily: "'Fredoka',sans-serif", fontWeight: 600 }}>
              <option value="">Toutes envies ❤</option>
              <option value="mine">Que j'ai envie de découvrir</option>
              <option value="any">Avec au moins une envie</option>
              <option value="none">Sans envie</option>
            </select>
            <select value={sort} onChange={(e) => setSort(e.target.value)} style={{ ...inputStyle, width: "auto", cursor: "pointer", fontFamily: "'Fredoka',sans-serif", fontWeight: 600 }}>
              <option value="alpha">A → Z</option>
              <option value="note">Mieux notés (général)</option>
              <option value="myNote">Mes meilleures notes</option>
              <option value="wants">Plus d'envies ❤</option>
              <option value="recent">Récents</option>
            </select>
            <button onClick={() => setView((v) => v === "grid" ? "list" : "grid")} title={view === "grid" ? "Afficher en liste" : "Afficher en grille"}
              style={{ ...inputStyle, width: "auto", cursor: "pointer", fontFamily: "'Fredoka',sans-serif", fontWeight: 600, display: "flex", alignItems: "center", gap: 6, color: C.navy }}>
              {view === "grid" ? <><Menu size={16} /> Liste</> : <><Library size={16} /> Grille</>}
            </button>
            {view === "grid" && (
              <label style={{ display: "flex", alignItems: "center", gap: 7, cursor: bothAuto ? "default" : "pointer", fontFamily: "'Fredoka',sans-serif", fontWeight: 600, fontSize: 13.5, color: bothAuto ? "#9c8d79" : C.navy, padding: "0 4px" }}
                title={bothAuto ? "Le tri « Mes meilleures notes » affiche toujours les deux notes" : "Afficher la note moyenne et votre note en même temps"}>
                <input type="checkbox" checked={showBoth || bothAuto} disabled={bothAuto} onChange={(e) => setShowBoth(e.target.checked)} style={{ width: 16, height: 16, accentColor: C.teal, cursor: bothAuto ? "default" : "pointer" }} />
                Voir les 2 notes
              </label>
            )}
          </div>

          {mine.length === 0 ? (
            <EmptyHint icon={Library} text="Aucun de vos jeux ne correspond à ces filtres." />
          ) : view === "list" ? (
            <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr)", gap: 4 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0, padding: "6px 14px", fontSize: 12, color: "#9c8d79", fontFamily: "'Fredoka',sans-serif", fontWeight: 600 }}>
                <span style={{ flex: 1, minWidth: 0 }}>Jeu</span>
                <span style={{ width: 60, flexShrink: 0, textAlign: "center" }} title="Membres qui veulent découvrir ce jeu">Envies</span>
                <span style={{ width: 70, flexShrink: 0, textAlign: "center" }}>Moyenne</span>
                <span style={{ width: 70, flexShrink: 0, textAlign: "center" }}>Ma note</span>
              </div>
              {mine.map((g) => {
                const { avg, count } = gameStats(g);
                const myR = currentUser ? (g.ratings?.[currentUser.id] || 0) : 0;
                const wantC = (g.wantIds || []).length;
                return (
                  <button key={g.id} onClick={() => setSelected(g.id)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 10, border: "1px solid #efe6d6", background: "#fff", cursor: "pointer", textAlign: "left", minWidth: 0 }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "rgba(30,138,138,.05)"} onMouseLeave={(e) => e.currentTarget.style.background = "#fff"}>
                    <span style={{ flex: 1, minWidth: 0, fontFamily: "'Fredoka',sans-serif", fontWeight: 600, color: C.navy, fontSize: 14.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {g.name}
                      {familyOwnerLabel(g) && <span style={{ marginLeft: 8, fontSize: 11.5, fontWeight: 700, color: C.purple }}>· {familyOwnerLabel(g)}</span>}
                    </span>
                    <span style={{ width: 60, flexShrink: 0, textAlign: "center", fontFamily: "'Fredoka',sans-serif", fontWeight: 700, fontSize: 13.5, color: wantC ? C.red : "#cdbfa8", display: "inline-flex", alignItems: "center", gap: 4, justifyContent: "center" }}>
                      {wantC > 0 && <Heart size={12} fill={C.red} color={C.red} />}{wantC || "—"}
                    </span>
                    <span style={{ width: 70, flexShrink: 0, textAlign: "center", fontFamily: "'Fredoka',sans-serif", fontWeight: 700, color: count ? C.amber : "#cdbfa8", fontSize: 14 }}>{count ? avg.toFixed(2).replace(".", ",") : "—"}</span>
                    <span style={{ width: 70, flexShrink: 0, textAlign: "center", fontFamily: "'Fredoka',sans-serif", fontWeight: 700, color: myR ? C.teal : "#cdbfa8", fontSize: 14 }}>{myR ? String(myR).replace(".", ",") : "—"}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 18 }}>
              {mine.map((g) => <GameCard key={g.id} g={g} onOpen={() => setSelected(g.id)} myGame globalShare={currentUser.shareLibrary !== false} onToggleShare={(val) => toggleGameShared(g.id, val)} showBoth={showBoth || bothAuto} ownerBadge={familyOwnerLabel(g)} />)}
            </div>
          )}
        </>
      )}

      {showAdd && <AddGameFlow onClose={() => setShowAdd(false)} setToast={setToast} />}

      {/* Fenetres ouvertes depuis les tuiles de statistiques */}
      {statPanel === "ext" && (
        <PickListModal
          title={`\ud83e\udde9 Mes extensions (${myExtList.length})`}
          subtitle="Cliquez sur une extension pour ouvrir la fiche du jeu auquel elle se rattache."
          empty="Vous n'avez encore déclaré aucune extension. Ajoutez-les depuis la fiche du jeu concerné."
          onClose={() => setStatPanel(null)}
          rows={myExtList.map(({ ext, game }) => ({
            key: ext.id, name: ext.name, img: ext.img, emoji: "\ud83e\udde9",
            sub: game.name,
            onClick: () => { setStatPanel(null); setSelected(game.id); },
            title: `Ouvrir la fiche de ${game.name}`,
          }))}
        />
      )}
      {statPanel === "rated" && (
        <PickListModal
          title={`\u2b50 Mes jeux notés (${myRatedList.length})`}
          subtitle="Classés de ma meilleure note à la moins bonne. Cliquez pour ouvrir la fiche du jeu."
          empty="Vous n'avez encore noté aucun jeu. Ouvrez une fiche et cliquez sur les étoiles !"
          onClose={() => setStatPanel(null)}
          rows={myRatedList.map(({ game, note }) => ({
            key: game.id, name: game.name, img: game.img,
            sub: game.owners && game.owners.length ? `chez ${game.owners.map((o) => o.name).join(", ")}` : null,
            right: (
              <span style={{ flexShrink: 0, display: "inline-flex", alignItems: "center", gap: 4, background: "rgba(232,163,23,.14)", color: C.amber, borderRadius: 999, padding: "3px 10px", fontFamily: "'Fredoka',sans-serif", fontWeight: 700, fontSize: 13 }}>
                <Star size={12} fill={C.amber} color={C.amber} /> {String(note).replace(".", ",")}
              </span>
            ),
            onClick: () => { setStatPanel(null); setSelected(game.id); },
          }))}
        />
      )}
      {statPanel === "status" && (
        <StatusInfoModal onClose={() => setStatPanel(null)} role={currentUser.role} isChild={isChildAccount(currentUser)} />
      )}

      {selected && <GameDetailModal g={games.find((g) => g.id === selected)} onClose={() => setSelected(null)} onAuth={() => {}} setToast={setToast} />}
    </div>
  );
}

function StatCard({ icon: Icon, color, n, label, small, onClick, title }) {
  const clickable = typeof onClick === "function";
  const base = { flex: small ? "1 1 190px" : "1 1 160px", background: C.paper, borderRadius: 18, padding: small ? "16px 16px" : "18px 22px", border: "1px solid #ece2d0", display: "flex", alignItems: "center", gap: small ? 11 : 14, minWidth: 0, boxSizing: "border-box", maxWidth: "100%", overflow: "hidden" };
  const inner = (
    <>
      <span style={{ width: 50, height: 50, borderRadius: 14, background: `${color}1a`, display: "grid", placeItems: "center", flexShrink: 0 }}><Icon size={24} color={color} /></span>
      <div style={{ minWidth: 0, flex: 1, textAlign: "left" }}>
        <div style={{
          fontFamily: "'Fredoka',sans-serif", fontWeight: 700, color: C.navy,
          fontSize: small ? "clamp(14px,3.6vw,18px)" : 28, lineHeight: 1.15,
          overflowWrap: "anywhere", hyphens: "auto",
        }}>{n}</div>
        <div style={{ fontSize: 13, color: "#8a7c6a", marginTop: 2, display: "flex", alignItems: "center", gap: 3, minWidth: 0 }}>
          <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</span>
          {clickable && <ChevronRight size={13} color={color} style={{ flexShrink: 0 }} />}
        </div>
      </div>
    </>
  );
  if (!clickable) return <div style={base}>{inner}</div>;
  return (
    <button type="button" onClick={onClick} title={title || label}
      style={{ ...base, cursor: "pointer", font: "inherit", transition: "border-color .15s, box-shadow .15s" }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = color; e.currentTarget.style.boxShadow = `0 4px 14px ${color}26`; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#ece2d0"; e.currentTarget.style.boxShadow = "none"; }}>
      {inner}
    </button>
  );
}

/* =============================================================================
   FOOTER
   ============================================================================= */
function Footer({ setPage }) {
  return (
    <footer style={{ background: C.navyDeep, color: "rgba(255,255,255,.7)", padding: "48px 24px 28px" }}>
      <div style={{ maxWidth: 1180, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 32 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 14 }}>
            <span style={{ display: "grid", placeItems: "center", width: 38, height: 38, borderRadius: 11, background: "#fff" }}><MeepleIcon size={22} color={C.navy} /></span>
            <Wordmark size={24} />
          </div>
          <p style={{ fontSize: 13.5, lineHeight: 1.6, maxWidth: 280, margin: 0 }}>
            À l'assaut des jeux — association loi 1901 de jeux de société du Coutançais, fondée en 2010.
          </p>
        </div>
        <div>
          <h4 style={{ color: "#fff", fontFamily: "'Fredoka',sans-serif", fontSize: 15, marginBottom: 12 }}>Navigation</h4>
          {NAV.map((n) => <button key={n.key} onClick={() => setPage(n.key)} style={footLink}>{n.label}</button>)}
        </div>
        <div>
          <h4 style={{ color: "#fff", fontFamily: "'Fredoka',sans-serif", fontSize: 15, marginBottom: 12 }}>Nous trouver</h4>
          <p style={{ fontSize: 13.5, lineHeight: 1.7, margin: 0 }}>
            <MapPin size={14} style={{ verticalAlign: "-2px" }} /> Local ALADJ<br />Gouville-sur-Mer (50560)<br />
            <span style={{ fontSize: 12.5, opacity: .8 }}>Ouverte aux +18 ans ; +14 ans accompagnés d'un adulte</span>
          </p>
        </div>
        <div>
          <h4 style={{ color: "#fff", fontFamily: "'Fredoka',sans-serif", fontSize: 15, marginBottom: 12 }}>Contact</h4>
          <p style={{ fontSize: 13.5, lineHeight: 1.7, margin: 0 }}>
            <a href="mailto:aladj50200@gmail.com" style={{ color: "#fff", textDecoration: "none", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 6 }}>
              <Mail size={14} /> aladj50200@gmail.com
            </a><br />
            <span style={{ fontSize: 12.5, opacity: .8 }}>Dates & infos détaillées sur Signal</span>
          </p>
        </div>
      </div>
      <div style={{ maxWidth: 1180, margin: "32px auto 0", paddingTop: 20, borderTop: "1px solid rgba(255,255,255,.12)", fontSize: 12.5, textAlign: "center", opacity: .7 }}>
        © {new Date().getFullYear()} À l'assaut des jeux (ALADJ) · Coutances / Gouville-sur-Mer, Manche
      </div>
    </footer>
  );
}
const footLink = { display: "block", background: "none", border: "none", color: "rgba(255,255,255,.7)", cursor: "pointer", padding: "4px 0", fontSize: 13.5, fontFamily: "'Nunito',sans-serif", textAlign: "left" };

/* =============================================================================
   ÉCRAN DE CONFIGURATION (si Supabase non branché)
   ============================================================================= */
function ConfigScreen() {
  return (
    <div style={{ minHeight: "100vh", background: C.cream, display: "grid", placeItems: "center", padding: 24 }}>
      <div style={{ maxWidth: 560, background: C.paper, borderRadius: 22, padding: 36, border: "1px solid #ece2d0", boxShadow: "0 10px 40px rgba(18,41,63,.1)" }}>
        <div style={{ width: 56, height: 56, borderRadius: 15, background: "rgba(232,163,23,.12)", display: "grid", placeItems: "center", marginBottom: 18 }}>
          <AlertTriangle size={28} color={C.amber} />
        </div>
        <h1 style={{ fontFamily: "'Fredoka',sans-serif", color: C.navy, fontSize: 26, margin: "0 0 10px" }}>Connexion à Supabase requise</h1>
        <p style={{ color: "#5e5346", fontSize: 15, lineHeight: 1.6, margin: "0 0 18px" }}>
          L'application n'a pas encore ses clés Supabase. Renseignez les deux variables suivantes,
          puis rechargez la page :
        </p>
        <div style={{ background: "#11202f", borderRadius: 12, padding: "16px 18px", fontFamily: "monospace", fontSize: 13, color: "#cde", marginBottom: 18, lineHeight: 1.8, overflowX: "auto" }}>
          VITE_SUPABASE_URL=https://xxxxx.supabase.co<br />
          VITE_SUPABASE_ANON_KEY=eyJhbGci...
        </div>
        <p style={{ color: "#8a7c6a", fontSize: 13.5, lineHeight: 1.6, margin: 0 }}>
          En local : dans un fichier <b>.env</b> à la racine du projet.<br />
          Sur Vercel : <b>Settings → Environment Variables</b>.<br />
          Le pas-à-pas complet est dans le guide d'installation fourni.
        </p>
      </div>
    </div>
  );
}

/* -----------------------------------------------------------------------------
   Nouveau mot de passe (apres avoir suivi le lien recu par e-mail)
   ----------------------------------------------------------------------------- */
function ResetPasswordModal() {
  const { updatePassword, setPasswordRecovery } = useApp();
  const [pwd, setPwd] = useState("");
  const [pwd2, setPwd2] = useState("");
  const [show, setShow] = useState(false);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const submit = async () => {
    setErr("");
    if (pwd.length < 6) { setErr("Le mot de passe doit faire au moins 6 caractères."); return; }
    if (pwd !== pwd2) { setErr("Les deux mots de passe ne correspondent pas."); return; }
    setBusy(true);
    const res = await updatePassword(pwd);
    setBusy(false);
    if (res.error) { setErr(res.error); return; }
    setDone(true);
  };
  return (
    <Modal open onClose={() => setPasswordRecovery(false)} title="Nouveau mot de passe" width={460}>
      {done ? (
        <div style={{ textAlign: "center", padding: "6px 4px" }}>
          <div style={{ width: 60, height: 60, borderRadius: "50%", background: "rgba(30,138,138,.12)", display: "grid", placeItems: "center", margin: "0 auto 16px" }}><Check size={28} color={C.teal} /></div>
          <p style={{ fontSize: 14.5, color: "#5e5346", lineHeight: 1.6, marginBottom: 20 }}>Ton mot de passe a bien été mis à jour, et tu es maintenant connecté !</p>
          <Btn full variant="teal" size="lg" onClick={() => setPasswordRecovery(false)}>Continuer</Btn>
        </div>
      ) : (
        <>
          <p style={{ fontSize: 14, color: "#6e6256", margin: "0 0 14px", lineHeight: 1.5 }}>Choisis un nouveau mot de passe pour ton compte.</p>
          <Field label="Nouveau mot de passe" hint="Au moins 6 caractères.">
            <div style={{ position: "relative" }}>
              <TextInput type={show ? "text" : "password"} value={pwd} onChange={(e) => setPwd(e.target.value)} placeholder="••••••••" style={{ paddingRight: 44 }} />
              <button type="button" onClick={() => setShow(!show)} aria-label={show ? "Masquer" : "Afficher"}
                style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#9c8d79", padding: 6, display: "grid", placeItems: "center" }}>
                {show ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </Field>
          <Field label="Confirmer le mot de passe">
            <TextInput type={show ? "text" : "password"} value={pwd2} onChange={(e) => setPwd2(e.target.value)} placeholder="••••••••" onKeyDown={(e) => e.key === "Enter" && submit()} />
          </Field>
          {err && <div style={{ background: "rgba(181,40,58,.1)", color: C.red, padding: "10px 14px", borderRadius: 11, fontSize: 13.5, fontWeight: 600, marginBottom: 14 }}>{err}</div>}
          <Btn onClick={submit} disabled={busy} full size="lg" variant="primary">{busy ? <Loader2 size={18} className="aladj-spin" /> : <><Lock size={17} /> Enregistrer le mot de passe</>}</Btn>
        </>
      )}
    </Modal>
  );
}

/* =============================================================================
   ROOT
   ============================================================================= */
function Shell() {
  const { ready, fatalError, currentUser, bannedNotice, setBannedNotice, chrono, closeChrono, markMomentsSeen, passwordRecovery } = useApp();
  // Retour du paiement en ligne : message + nettoyage de l'URL.
  useEffect(() => {
    try {
      const q = new URLSearchParams(window.location.search);
      const c = q.get("cotisation");
      if (!c) return;
      setToast(c === "ok"
        ? "Merci ! Votre cotisation est réglée — votre statut de membre décisionnaire est actif. Un e-mail de bienvenue arrive."
        : "Paiement annulé — vous pouvez réessayer quand vous voulez depuis Mon espace.");
      q.delete("cotisation");
      window.history.replaceState({}, "", window.location.pathname + (q.toString() ? "?" + q.toString() : ""));
    } catch (e) {}
  }, []); // eslint-disable-line

  const [page, setPage] = useState(() => {
    try {
      const u = new URLSearchParams(window.location.search).get("page");
      const valid = ["accueil", "soirees", "ludotheque", "ma-ludo", "a-venir", "locations", "guide"];
      return u && valid.includes(u) ? u : "accueil";
    } catch (e) { return "accueil"; }
  });
  const [auth, setAuth] = useState(null);
  const [toast, setToast] = useState("");

  useEffect(() => { window.scrollTo({ top: 0, behavior: "smooth" }); }, [page]);
  useEffect(() => { if (!currentUser && (page === "ma-ludo" || page === "locations")) setPage("accueil"); }, [currentUser, page]);
  // L'onglet decisionnaire disparait si l'on perd ce statut (cotisation expiree,
  // deconnexion) : on ne laisse pas l'utilisateur bloque sur une page vide.
  useEffect(() => { if (page === "decideur" && !isDecideur(currentUser)) setPage("accueil"); }, [currentUser, page]);
  useEffect(() => { if (page === "soirees") markMomentsSeen(); }, [page]); // eslint-disable-line

  if (fatalError === "config") return <ConfigScreen />;

  if (!ready) {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: C.cream }}>
        <div style={{ textAlign: "center" }}>
          <div className="aladj-bounce" style={{ display: "inline-block" }}><MeepleIcon size={48} color={C.navy} /></div>
          <p style={{ fontFamily: "'Fredoka',sans-serif", color: C.navy, marginTop: 12, fontWeight: 600 }}>Chargement de la ludothèque...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: C.cream, display: "flex", flexDirection: "column" }}>
      <Navbar page={page} setPage={setPage} onAuth={(m) => setAuth(m)} />
      {fatalError && fatalError !== "config" && (
        <div style={{ background: "rgba(181,40,58,.1)", color: C.red, padding: "10px 20px", textAlign: "center", fontSize: 14, fontWeight: 600 }}>
          {fatalError}
        </div>
      )}
      <main style={{ flex: 1 }}>
        {page === "accueil" && <HomePage setPage={setPage} onAuth={(m) => setAuth(m)} />}
        {page === "soirees" && <EventsPage onAuth={(m) => setAuth(m)} setToast={setToast} />}
        {page === "ludotheque" && <LudothequePage onAuth={(m) => setAuth(m)} setToast={setToast} setPage={setPage} />}
        {page === "ma-ludo" && currentUser && <MyLudoPage setToast={setToast} setPage={setPage} />}
        {page === "a-venir" && <UpcomingPage onAuth={(m) => setAuth(m)} setToast={setToast} />}
        {page === "locations" && currentUser && <LocationsPage setToast={setToast} />}
        {page === "decideur" && currentUser && <DeciderPage setToast={setToast} />}
        {page === "guide" && <GuidePage />}
      </main>
      <Footer setPage={setPage} />
      {auth && <AuthModal mode={auth} onClose={() => setAuth(null)} setToast={setToast} />}
      {passwordRecovery && <ResetPasswordModal />}
      {bannedNotice && (
        <Modal open onClose={() => setBannedNotice(false)} title="Accès suspendu" width={440}>
          <div style={{ textAlign: "center", padding: "8px 4px" }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(181,40,58,.1)", display: "grid", placeItems: "center", margin: "0 auto 16px" }}>
              <Lock size={26} color={C.red} />
            </div>
            <p style={{ fontSize: 15, color: "#5e5346", lineHeight: 1.6, margin: "0 0 18px" }}>
              Votre accès au site a été suspendu. Si vous pensez qu'il s'agit d'une erreur, contactez l'association à l'adresse <a href="mailto:aladj50200@gmail.com" style={{ color: C.teal, fontWeight: 600 }}>aladj50200@gmail.com</a>.
            </p>
            <Btn variant="soft" onClick={() => setBannedNotice(false)}>Fermer</Btn>
          </div>
        </Modal>
      )}
      {chrono && (
        <PlayTimer
          supabase={supabase}
          currentUser={currentUser ? { id: currentUser.id, name: currentUser.name, avatar_url: currentUser.avatar } : null}
          gameId={chrono.gameId}
          eventId={chrono.eventId}
          joinCode={chrono.joinCode}
          onExit={closeChrono}
        />
      )}
      <Toast msg={toast} onDone={() => setToast("")} />
    </div>
  );
}

export default function App() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&family=Nunito:wght@400;600;700&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; font-family: 'Nunito', sans-serif; -webkit-font-smoothing: antialiased; background: ${C.cream}; }
        img, video, canvas { max-width: 100%; }
        /* Safari iOS zoome automatiquement quand on touche un champ dont le texte
           fait moins de 16px : la page reste ensuite agrandie. 16px = pas de zoom. */
        @media (max-width: 860px) {
          input:not([type="checkbox"]):not([type="radio"]), textarea { font-size: 16px !important; }
        }
        /* Sur téléphone, on récupère 16 px de large de chaque côté dans les fenêtres. */
        @media (max-width: 520px) {
          .aladj-modal-head { padding: 14px 16px !important; }
          .aladj-modal-body { padding: 16px !important; }
        }
        button { font-family: inherit; }
        /* Le geste de defilement ne doit pas « deborder » d'une zone defilante
           vers la page qui se trouve derriere.
           ATTENTION : ne jamais poser cette propriete sur TOUS les descendants.
           Sur un element qui ne defile pas, elle empeche le geste de remonter
           vers l'ancetre qui defile, et la fenetre devient impossible a faire
           defiler au doigt. On la reserve donc aux conteneurs qui defilent
           vraiment ; le gel du <body> (useScrollLock) suffit pour le reste. */
        [style*="overflow-y: auto"], [style*="overflow-y:auto"],
        [style*="overflow: auto"], [style*="overflow:auto"] { overscroll-behavior: contain; }
        select { -webkit-appearance: none; appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%231A3A5C' stroke-width='3'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 12px center; padding-right: 34px !important; }
        textarea:focus { border-color: ${C.teal} !important; }
        ::-webkit-scrollbar { width: 10px; height: 10px; }
        ::-webkit-scrollbar-thumb { background: #d9cbb4; border-radius: 99px; }
        @keyframes popIn { from { opacity: 0; transform: scale(.94) translateY(8px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes bounce { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-14px); } }
        .aladj-spin { animation: spin 1s linear infinite; }
        .aladj-bounce { animation: bounce 1s ease-in-out infinite; }
        .aladj-burger { display: none !important; }
        @media (max-width: 860px) {
          .aladj-desktop-nav { display: none !important; }
          .aladj-burger { display: grid !important; }
        }
        @media (min-width: 861px) { .aladj-mobile-menu { display: none !important; } }
        @media (max-width: 920px) {
          .aladj-ludo-grid { display: flex !important; flex-direction: column !important; }
          .aladj-ludo-aside { position: static !important; order: -1; }
          .aladj-ludo-aside .aladj-ludo-custom { border-width: 2px; }
        }
        @media (max-width: 600px) {
          .aladj-cal-grid { gap: 3px !important; }
          .aladj-cal-cell { padding: 2px !important; border-radius: 8px !important; }
          .aladj-cal-cell > span:first-child { font-size: 12px !important; }
        }
      `}</style>
      <AppProvider><Shell /></AppProvider>
    </>
  );
}
